
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Scan, 
  History, 
  Plus, 
  Minus, 
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  AlertCircle,
  Zap,
  Store
} from 'lucide-react';
import { AppView, Product, InventoryHistory } from './types';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import Scanner from './components/Scanner';
import HistoryLog from './components/HistoryLog';
import ScanToast from './components/ScanToast';

const STORAGE_KEY = 'mm_minimart_inventory';
const HISTORY_KEY = 'mm_minimart_history';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [lastLaserScan, setLastLaserScan] = useState<{sku: string, timestamp: number} | null>(null);
  
  const laserBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // Load data on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem(STORAGE_KEY);
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save data on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }
  };

  const handleLaserScan = useCallback((sku: string) => {
    playBeep();
    setLastLaserScan({ sku, timestamp: Date.now() });
    // Auto-clear toast after 5 seconds
    setTimeout(() => setLastLaserScan(prev => prev?.sku === sku ? null : prev), 5000);
  }, []);

  // Global Keyboard Listener for Laser Scanners (HID)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      
      // Scanners are very fast. If the interval between keys is > 50ms, it's probably a human.
      if (e.key === 'Enter') {
        if (laserBuffer.current.length > 2) {
          handleLaserScan(laserBuffer.current);
        }
        laserBuffer.current = '';
      } else if (e.key.length === 1) {
        // Only add single characters
        laserBuffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaserScan]);

  const addHistoryEntry = (productId: string, productName: string, type: 'IN' | 'OUT', quantity: number) => {
    const newEntry: InventoryHistory = {
      id: crypto.randomUUID(),
      productId,
      productName,
      type,
      quantity,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 100)); // Keep last 100
  };

  const addProduct = (product: Omit<Product, 'id' | 'lastUpdated'>) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString()
    };
    setInventory(prev => [newProduct, ...prev]);
    addHistoryEntry(newProduct.id, newProduct.name, 'IN', newProduct.stock);
  };

  const updateStock = (sku: string, amount: number, productDetails?: Partial<Product>) => {
    let result: 'UPDATED' | 'CREATED' | 'NOT_FOUND' = 'NOT_FOUND';
    
    setInventory(prev => {
      const existingIdx = prev.findIndex(p => p.sku === sku);
      
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newStock = Math.max(0, item.stock + amount);
        
        updated[existingIdx] = {
          ...item,
          ...productDetails,
          stock: newStock,
          lastUpdated: new Date().toISOString()
        };
        
        addHistoryEntry(item.id, item.name, amount > 0 ? 'IN' : 'OUT', Math.abs(amount));
        result = 'UPDATED';
        return updated;
      } else {
        if (amount > 0) {
          const newItem: Product = {
            id: crypto.randomUUID(),
            sku,
            name: productDetails?.name || `New Item (${sku})`,
            description: productDetails?.description || '',
            category: productDetails?.category || 'General',
            price: productDetails?.price || 0,
            stock: amount,
            minStock: 5,
            lastUpdated: new Date().toISOString()
          };
          addHistoryEntry(newItem.id, newItem.name, 'IN', amount);
          result = 'CREATED';
          return [newItem, ...prev];
        }
        return prev;
      }
    });
    return result;
  };

  const deleteProduct = (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
  };

  const renderView = () => {
    switch (view) {
      case AppView.DASHBOARD:
        return <Dashboard inventory={inventory} history={history} onNavigate={setView} />;
      case AppView.INVENTORY:
        return (
          <InventoryList 
            inventory={inventory} 
            onUpdateStock={updateStock} 
            onDelete={deleteProduct} 
            onAddProduct={addProduct}
          />
        );
      case AppView.SCANNER:
        return (
          <Scanner 
            inventory={inventory} 
            onScan={updateStock} 
          />
        );
      case AppView.HISTORY:
        return <HistoryLog history={history} />;
      default:
        return <Dashboard inventory={inventory} history={history} onNavigate={setView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Sidebar Toggle - Hidden on desktop */}
      <nav className="md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">M&M Minimart</h1>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.DASHBOARD ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setView(AppView.INVENTORY)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.INVENTORY ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Inventory</span>
          </button>
          
          <button 
            onClick={() => setView(AppView.SCANNER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.SCANNER ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Scan className="w-5 h-5" />
            <span className="font-medium">AI Scanner</span>
          </button>
          
          <button 
            onClick={() => setView(AppView.HISTORY)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.HISTORY ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">History</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">MM</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">M&M Manager</p>
                <p className="text-xs text-slate-500 truncate">v1.4.0-stable</p>
              </div>
            </div>
            {/* Laser Status */}
            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" /> Laser Ready
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Global Laser Scan Feedback Overlay */}
      {lastLaserScan && (
        <ScanToast 
          sku={lastLaserScan.sku} 
          inventory={inventory}
          onUpdate={updateStock}
          onClose={() => setLastLaserScan(null)}
        />
      )}
      
      {/* Mobile Nav Overlay (Sticky Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <button onClick={() => setView(AppView.DASHBOARD)} className={view === AppView.DASHBOARD ? 'text-blue-600' : 'text-slate-400'}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button onClick={() => setView(AppView.INVENTORY)} className={view === AppView.INVENTORY ? 'text-blue-600' : 'text-slate-400'}>
          <Package className="w-6 h-6" />
        </button>
        <button onClick={() => setView(AppView.SCANNER)} className="bg-blue-600 text-white p-3 rounded-full -mt-12 border-4 border-white shadow-lg">
          <Scan className="w-6 h-6" />
        </button>
        <button onClick={() => setView(AppView.HISTORY)} className={view === AppView.HISTORY ? 'text-blue-600' : 'text-slate-400'}>
          <History className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default App;
