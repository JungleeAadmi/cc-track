import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import { Plus, Eye, CheckCircle, Clock } from 'lucide-react';

const Lending = () => {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  
  // Selection
  const [selectedLending, setSelectedLending] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({ person_name: '', total_amount: '' });
  const [returnAmount, setReturnAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);

  const fetchLendings = async () => {
    const res = await api.get('/api/lending/');
    setLendings(res.data);
  };

  useEffect(() => { fetchLendings(); }, []);

  // --- Handlers ---

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
    if (!proofFile) {
      alert("Proof screenshot is required!");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', returnAmount);
    formData.append('file', proofFile);
    
    try {
      await api.post(`/api/lending/${selectedLending.id}/return`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowReturnModal(false);
      setReturnAmount('');
      setProofFile(null);
      fetchLendings();
    } catch(e) {
      alert("Failed to upload return");
    } finally {
      setLoading(false);
    }
  };

  const openReturnModal = (lending) => {
    setSelectedLending(lending);
    setShowReturnModal(true);
  };

  const openProofModal = (lending) => {
    setSelectedLending(lending);
    setShowProofModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lending Tracker</h2>
        <Button onClick={() => setShowAddModal(true)}><Plus size={20}/> New</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {lendings.map(l => (
          <Card key={l.id} className={`border-l-4 ${l.is_settled ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{l.person_name}</h3>
                <p className="text-xs text-slate-400">{new Date(l.lent_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Pending</p>
                <p className={`text-xl font-bold ${l.pending_amount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ₹{l.pending_amount}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
              <div 
                className={`h-2.5 rounded-full ${l.is_settled ? 'bg-green-500' : 'bg-blue-500'}`} 
                style={{ width: `${(l.returned_amount / l.total_amount) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Returned: ₹{l.returned_amount} / ₹{l.total_amount}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openProofModal(l)} className="p-2">
                  <Eye size={18} />
                </Button>
                {!l.is_settled && (
                  <Button size="sm" onClick={() => openReturnModal(l)} className="py-1 px-3 text-sm">
                    Add Return
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* --- Modals --- */}

      {/* 1. Add Lending Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Lending">
        <form onSubmit={handleCreateLending} className="space-y-4">
          <Input label="Person Name" value={addForm.person_name} onChange={e => setAddForm({...addForm, person_name: e.target.value})} required />
          <Input label="Amount (₹)" type="number" value={addForm.total_amount} onChange={e => setAddForm({...addForm, total_amount: e.target.value})} required />
          <Button type="submit" className="w-full" isLoading={loading}>Create Record</Button>
        </form>
      </Modal>

      {/* 2. Add Return Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title={`Return from ${selectedLending?.person_name}`}>
        <form onSubmit={handleAddReturn} className="space-y-4">
          <Input label="Return Amount (₹)" type="number" value={returnAmount} onChange={e => setReturnAmount(e.target.value)} required />
          <FileInput label="Upload Screenshot" onChange={e => setProofFile(e.target.files[0])} accept="image/*" />
          <Button type="submit" className="w-full" isLoading={loading}>Save Return</Button>
        </form>
      </Modal>

      {/* 3. View Proofs Modal */}
      <Modal isOpen={showProofModal} onClose={() => setShowProofModal(false)} title="Return History">
        <div className="space-y-4">
          {selectedLending?.returns.length === 0 ? (
             <p className="text-slate-500 text-center py-4">No returns recorded yet.</p>
          ) : (
             selectedLending?.returns.map(ret => (
               <div key={ret.id} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                 <div className="flex justify-between mb-2">
                   <span className="font-bold text-green-400">₹{ret.amount}</span>
                   <span className="text-xs text-slate-500">{new Date(ret.return_date).toLocaleDateString()}</span>
                 </div>
                 {ret.proof_image_path ? (
                   <img 
                      src={`/uploads/${ret.proof_image_path}`} 
                      alt="Proof" 
                      className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90"
                      onClick={() => window.open(`/uploads/${ret.proof_image_path}`, '_blank')}
                   />
                 ) : (
                   <span className="text-xs text-red-400">No Image</span>
                 )}
               </div>
             ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Lending;