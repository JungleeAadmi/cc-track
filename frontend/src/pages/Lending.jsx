import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import useLongPress from '../hooks/useLongPress';
import { Plus, Eye } from 'lucide-react';

const ActionMenu = ({ isOpen, onClose, onDelete }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-surface w-full max-w-sm rounded-xl border border-white/10 overflow-hidden" onClick={e=>e.stopPropagation()}>
                <button onClick={onDelete} className="w-full p-4 text-left text-red-400 hover:bg-red-500/10 border-b border-white/5">Delete Record</button>
                <button onClick={onClose} className="w-full p-4 text-center text-slate-500 hover:bg-white/5">Cancel</button>
            </div>
        </div>
    );
};

const Lending = () => {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  
  const [selectedLending, setSelectedLending] = useState(null);
  const [actionLending, setActionLending] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({ person_name: '', total_amount: '' });
  const [addProof, setAddProof] = useState(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => { fetchLendings(); }, []);

  const fetchLendings = async () => {
    try {
        const res = await api.get('/api/lending/');
        setLendings(res.data);
    } catch(e) {}
  };

  const handleCreateLending = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('person_name', addForm.person_name);
    formData.append('total_amount', addForm.total_amount);
    if(addProof) formData.append('proof', addProof);

    await api.post('/api/lending/', formData);
    setLoading(false);
    setShowAddModal(false);
    setAddForm({ person_name: '', total_amount: '' }); setAddProof(null);
    fetchLendings();
  };

  const handleAddReturn = async (e) => {
    e.preventDefault();
    if (!selectedLending) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', returnAmount);
    if(proofFile) formData.append('file', proofFile); // Optional now

    try {
      await api.post(`/api/lending/${selectedLending.id}/return`, formData);
      setShowReturnModal(false);
      setReturnAmount(''); setProofFile(null);
      fetchLendings();
    } catch(e) {
        alert("Failed to return. Check inputs.");
    } finally { setLoading(false); }
  };

  const longPressProps = useLongPress(
    (e) => {
        const lId = e.target.closest('[data-lending-id]')?.dataset.lendingId;
        const l = lendings.find(i => i.id == lId);
        if(l) setActionLending(l);
    },
    () => {}, 
    { delay: 800 }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Lending Tracker</h2>
        <Button onClick={() => setShowAddModal(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-4">
        {lendings.map(l => {
           // Fixed Progress Calculation
           const percentage = Math.min((l.returned_amount / l.total_amount) * 100, 100);
           
           return (
              <div key={l.id} data-lending-id={l.id} {...longPressProps} className={`bg-surface border-l-4 ${l.is_settled ? 'border-l-green-500' : 'border-l-orange-500'} rounded-xl p-4 shadow-lg select-none touch-manipulation`}>
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

                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${l.is_settled ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Returned: ₹{l.returned_amount.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {setSelectedLending(l); setShowProofModal(true)}} className="p-2"><Eye size={18} /></Button>
                    {!l.is_settled && (
                      <Button size="sm" onClick={() => {setSelectedLending(l); setShowReturnModal(true)}} className="py-1 px-3 text-sm">Add Return</Button>
                    )}
                  </div>
                </div>
              </div>
           );
        })}
      </div>

      <ActionMenu isOpen={!!actionLending} onClose={() => setActionLending(null)} onDelete={() => alert("Delete coming in v2.1")} />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Lending">
        <form onSubmit={handleCreateLending} className="space-y-4">
          <Input label="Person Name" value={addForm.person_name} onChange={e => setAddForm({...addForm, person_name: e.target.value})} required />
          <Input label="Amount (₹)" type="number" value={addForm.total_amount} onChange={e => setAddForm({...addForm, total_amount: e.target.value})} required />
          <FileInput label="Proof of Lend (Optional)" onChange={e => setAddProof(e.target.files[0])} accept="image/*" />
          <Button type="submit" className="w-full" isLoading={loading}>Create Record</Button>
        </form>
      </Modal>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title={`Return from ${selectedLending?.person_name}`}>
        <form onSubmit={handleAddReturn} className="space-y-4">
          <Input label="Amount (₹)" type="number" value={returnAmount} onChange={e => setReturnAmount(e.target.value)} required />
          <FileInput label="Proof (Optional)" onChange={e => setProofFile(e.target.files[0])} accept="image/*" />
          <Button type="submit" className="w-full" isLoading={loading}>Save Return</Button>
        </form>
      </Modal>
      
      {/* Proof Modal kept simple for brevity */}
       <Modal isOpen={showProofModal} onClose={() => setShowProofModal(false)} title="History">
            <div className="space-y-3">
                {selectedLending?.returns.map(r => (
                    <div key={r.id} className="p-3 bg-black/40 rounded flex justify-between">
                         <span>₹{r.amount}</span>
                         {r.proof_image_path && <a href={`/uploads/${r.proof_image_path}`} target="_blank" className="text-primary text-xs underline">View Proof</a>}
                    </div>
                ))}
            </div>
       </Modal>
    </div>
  );
};

export default Lending;