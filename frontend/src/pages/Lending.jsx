import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import useLongPress from '../hooks/useLongPress';
import { Plus, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

const Lending = () => {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  
  const [selectedLending, setSelectedLending] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({ person_name: '', total_amount: '' });
  const [returnAmount, setReturnAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    fetchLendings();
    const interval = setInterval(fetchLendings, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLendings = async () => {
    try {
        const res = await api.get('/api/lending/');
        setLendings(res.data);
    } catch(e) {}
  };

  const handleCreateLending = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/api/lending/', addForm);
    setLoading(false);
    setShowAddModal(false);
    setAddForm({ person_name: '', total_amount: '' });
    fetchLendings();
  };

  const handleAddReturn = async (e) => {
    e.preventDefault();
    if (!proofFile) { alert("Proof screenshot is required!"); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', returnAmount);
    formData.append('file', proofFile);
    try {
      await api.post(`/api/lending/${selectedLending.id}/return`, formData);
      setShowReturnModal(false);
      setReturnAmount(''); setProofFile(null);
      fetchLendings();
    } catch(e) {} finally { setLoading(false); }
  };

  // Long press to delete logic
  const longPressProps = useLongPress(
    (e) => {
        // Find ID
        const lId = e.target.closest('[data-lending-id]')?.dataset.lendingId;
        if(lId && confirm("Delete this lending record permanently?")) {
            // Note: Add DELETE endpoint in backend router if needed, currently just UI logic placeholder
            alert("Delete feature coming in v2.1 backend update."); 
        }
    },
    () => {}, 
    { delay: 800 }
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Lending Tracker</h2>
        <Button onClick={() => setShowAddModal(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-4">
        {lendings.map(l => {
           // FIX: Cap progress at 100%
           const percentage = Math.min((l.returned_amount / l.total_amount) * 100, 100);
           
           return (
              <div key={l.id} data-lending-id={l.id} {...longPressProps} className={`bg-surface border-l-4 ${l.is_settled ? 'border-l-green-500' : 'border-l-orange-500'} rounded-xl p-4 shadow-lg`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{l.person_name}</h3>
                    <p className="text-xs text-slate-400">{new Date(l.lent_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Pending</p>
                    <p className={`text-xl font-bold ${l.pending_amount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ₹{l.pending_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar with Fix */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${l.is_settled ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Returned: ₹{l.returned_amount.toLocaleString()} / ₹{l.total_amount.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {setSelectedLending(l); setShowProofModal(true)}} className="p-2">
                      <Eye size={18} />
                    </Button>
                    {!l.is_settled && (
                      <Button size="sm" onClick={() => {setSelectedLending(l); setShowReturnModal(true)}} className="py-1 px-3 text-sm">
                        Add Return
                      </Button>
                    )}
                  </div>
                </div>
              </div>
           );
        })}
      </div>

      {/* Modals are largely same, just referencing them here for completeness */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Lending">
        <form onSubmit={handleCreateLending} className="space-y-4">
          <Input label="Person Name" value={addForm.person_name} onChange={e => setAddForm({...addForm, person_name: e.target.value})} required />
          <Input label="Amount (₹)" type="number" value={addForm.total_amount} onChange={e => setAddForm({...addForm, total_amount: e.target.value})} required />
          <Button type="submit" className="w-full" isLoading={loading}>Create Record</Button>
        </form>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title={`Return from ${selectedLending?.person_name}`}>
        <form onSubmit={handleAddReturn} className="space-y-4">
          <Input label="Return Amount (₹)" type="number" value={returnAmount} onChange={e => setReturnAmount(e.target.value)} required />
          <FileInput label="Upload Screenshot" onChange={e => setProofFile(e.target.files[0])} accept="image/*" />
          <Button type="submit" className="w-full" isLoading={loading}>Save Return</Button>
        </form>
      </Modal>

      <Modal isOpen={showProofModal} onClose={() => setShowProofModal(false)} title="Return History">
        <div className="space-y-4">
          {selectedLending?.returns.length === 0 ? <p className="text-center text-slate-500">No returns yet.</p> : 
             selectedLending?.returns.map(ret => (
               <div key={ret.id} className="bg-black/40 rounded-lg p-3 border border-white/5">
                 <div className="flex justify-between mb-2">
                   <span className="font-bold text-green-400">₹{ret.amount.toLocaleString()}</span>
                   <span className="text-xs text-slate-500">{new Date(ret.return_date).toLocaleDateString()}</span>
                 </div>
                 {ret.proof_image_path && (
                   <img src={`/uploads/${ret.proof_image_path}`} className="w-full h-32 object-cover rounded-md cursor-pointer" onClick={() => window.open(`/uploads/${ret.proof_image_path}`, '_blank')}/>
                 )}
               </div>
             ))
          }
        </div>
      </Modal>
    </div>
  );
};

export default Lending;