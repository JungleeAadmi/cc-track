import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput, Money } from '../components/ui';
import Modal from '../components/Modal';
import VirtualCard from '../components/VirtualCard';
import { Plus, RotateCw, CheckCircle, FileText, Pencil, Trash2 } from 'lucide-react';
import FilePreviewModal from '../components/FilePreviewModal';

const CardDetailModal = ({ card, isOpen, onClose, onRefresh, onEdit, onDelete }) => {
  const [showBackSide, setShowBackSide] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddStmtModal, setShowAddStmtModal] = useState(false);
  const [selectedStmt, setSelectedStmt] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  
  const [stmtMonth, setStmtMonth] = useState('January');
  const [stmtYear, setStmtYear] = useState(new Date().getFullYear());
  const [stmtForm, setStmtForm] = useState({ generated_date: '', due_date: '', total_due: '', min_due: '' });
  const [stmtFile, setStmtFile] = useState(null);
  
  const [payForm, setPayForm] = useState({ paid_amount: '', payment_ref: '', paid_date: '' });
  const [payProof, setPayProof] = useState(null);

  if (!isOpen || !card) return null;

  const handleAddStatement = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const fullMonth = `${stmtMonth} ${stmtYear}`;
    formData.append('month', fullMonth);
    Object.keys(stmtForm).forEach(k => formData.append(k, stmtForm[k]));
    if(stmtFile) formData.append('attachment', stmtFile);
    await api.post(`/api/cards/${card.id}/statements`, formData);
    setShowAddStmtModal(false); onRefresh();
  };

  const handleDeleteStatement = async (stmtId) => {
      if(confirm("Delete this statement?")) {
          await api.delete(`/api/cards/statements/${stmtId}`);
          onRefresh();
      }
  }

  const handlePay = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('paid_amount', payForm.paid_amount);
    formData.append('payment_ref', payForm.payment_ref);
    formData.append('paid_date', payForm.paid_date);
    if(payProof) formData.append('proof', payProof);
    await api.post(`/api/cards/statements/${selectedStmt.id}/pay`, formData);
    setShowPayModal(false); onRefresh();
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-lg h-[90vh] flex flex-col relative bg-surface border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white">{card.name}</h3>
                    <div className="flex gap-1">
                        <button onClick={onEdit} className="text-slate-300 hover:text-white p-1 bg-white/5 rounded"><Pencil size={14}/></button>
                        <button onClick={onDelete} className="text-red-400 hover:text-red-300 p-1 bg-red-900/20 rounded"><Trash2 size={14}/></button>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Swap Logic for Card Image */}
                <div className="w-full aspect-[1.58/1] cursor-pointer group relative" onClick={() => setShowBackSide(!showBackSide)}>
                    {!showBackSide ? (
                        card.front_image_path ? <img src={`/uploads/${card.front_image_path}`} className="w-full h-full object-cover rounded-2xl border border-white/10" alt="Front" /> : <VirtualCard card={card} isMasked={false} />
                    ) : (
                        card.back_image_path ? <img src={`/uploads/${card.back_image_path}`} className="w-full h-full object-cover rounded-2xl border border-white/10" alt="Back" /> : <div className="w-full h-full bg-slate-900 rounded-2xl border border-white/20 flex flex-col justify-center items-center"><span className="text-slate-500 text-sm">No Back Image</span></div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur text-white/70 text-xs flex items-center gap-1"><RotateCw size={12}/> {showBackSide ? "Show Front" : "Show Back"}</div>
                </div>
                
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('details')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'details' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Details</button>
                    <button onClick={() => setActiveTab('statements')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'statements' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Statements</button>
                </div>

                {activeTab === 'details' ? (
                     <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                            <div><p className="text-slate-500">Total Limit</p><p className="text-lg font-bold text-white"><Money amount={card.limit} /></p></div>
                            <div><p className="text-slate-500">Network</p><p className="text-white">{card.card_network} {card.card_type}</p></div>
                            <div><p className="text-slate-500">Statement</p><p className="text-white">{card.statement_date ? `Day ${card.statement_date}` : 'N/A'}</p></div>
                            <div><p className="text-slate-500">Due Date</p><p className="text-white">{card.payment_due_date ? `Day ${card.payment_due_date}` : 'N/A'}</p></div>
                        </div>
                     </div>
                ) : (
                    <div className="space-y-3">
                        <Button size="sm" className="w-full" onClick={()=>setShowAddStmtModal(true)}><Plus size={16}/> Record Statement</Button>
                        {card.statements?.slice().reverse().map(st => (
                            <div key={st.id} className="bg-black/20 p-3 rounded-xl border border-white/5 relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div><p className="font-bold text-white">{st.month}</p><p className="text-xs text-slate-400">Due: {new Date(st.due_date).toLocaleDateString()}</p></div>
                                    <div className="text-right"><p className="font-bold text-white"><Money amount={st.total_due}/></p>{st.is_paid ? <span className="text-[10px] text-green-400 flex items-center gap-1 justify-end"><CheckCircle size={10}/> Paid</span> : <span className="text-[10px] text-red-400">Unpaid</span>}</div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {!st.is_paid && <Button size="sm" variant="secondary" className="h-7 text-xs flex-1" onClick={()=>{setSelectedStmt(st); setPayForm({...payForm, paid_amount: st.total_due, paid_date: new Date().toISOString().split('T')[0]}); setShowPayModal(true);}}>Pay</Button>}
                                    {st.attachment_path && <button onClick={()=>setPreviewFile(`/uploads/${st.attachment_path}`)} className="text-xs text-primary bg-primary/10 px-2 rounded hover:bg-primary/20 flex items-center gap-1"><FileText size={10}/> PDF</button>}
                                    <button onClick={()=>handleDeleteStatement(st.id)} className="text-xs text-red-400 bg-red-900/10 px-2 rounded hover:bg-red-900/20">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <FilePreviewModal isOpen={!!previewFile} fileUrl={previewFile} onClose={()=>setPreviewFile(null)} />

             {showAddStmtModal && (
                <div className="absolute inset-0 bg-surface z-20 p-4 overflow-y-auto">
                     <h3 className="font-bold mb-4">Add Statement</h3>
                     <form onSubmit={handleAddStatement} className="space-y-3">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                 <label className="text-xs font-semibold text-slate-400 uppercase">Month</label>
                                 <select className="w-full h-12 bg-black/40 border border-slate-700 rounded-xl px-4 text-white" value={stmtMonth} onChange={e=>setStmtMonth(e.target.value)}>{months.map(m=><option key={m}>{m}</option>)}</select>
                             </div>
                             <div className="space-y-1">
                                 <label className="text-xs font-semibold text-slate-400 uppercase">Year</label>
                                 <input type="number" className="w-full h-12 bg-black/40 border border-slate-700 rounded-xl px-4 text-white" value={stmtYear} onChange={e=>setStmtYear(e.target.value)} />
                             </div>
                         </div>
                         <Input label="Generated" type="date" value={stmtForm.generated_date} onChange={e=>setStmtForm({...stmtForm, generated_date: e.target.value})} required/>
                         <Input label="Due Date" type="date" value={stmtForm.due_date} onChange={e=>setStmtForm({...stmtForm, due_date: e.target.value})} required/>
                         <Input label="Total Due" type="number" value={stmtForm.total_due} onChange={e=>setStmtForm({...stmtForm, total_due: e.target.value})} required/>
                         <Input label="Min Due" type="number" value={stmtForm.min_due} onChange={e=>setStmtForm({...stmtForm, min_due: e.target.value})}/>
                         <FileInput label="Statement PDF" onChange={e=>setStmtFile(e.target.files[0])}/>
                         <div className="flex gap-2"><Button type="submit" className="flex-1">Save</Button><Button type="button" variant="ghost" className="flex-1" onClick={()=>setShowAddStmtModal(false)}>Cancel</Button></div>
                     </form>
                </div>
            )}
            {showPayModal && (
                <div className="absolute inset-0 bg-surface z-20 p-4 flex flex-col justify-center">
                    <h3 className="font-bold mb-4">Record Payment</h3>
                    <form onSubmit={handlePay} className="space-y-4">
                        <Input label="Amount Paid" type="number" value={payForm.paid_amount} onChange={e=>setPayForm({...payForm, paid_amount: e.target.value})}/>
                        <Input label="Payment Date" type="date" value={payForm.paid_date} onChange={e=>setPayForm({...payForm, paid_date: e.target.value})} required/>
                        <Input label="Ref #" value={payForm.payment_ref} onChange={e=>setPayForm({...payForm, payment_ref: e.target.value})}/>
                        <FileInput label="Proof" onChange={e=>setPayProof(e.target.files[0])}/>
                        <div className="flex gap-2"><Button type="submit" className="flex-1">Confirm</Button><Button type="button" variant="ghost" className="flex-1" onClick={()=>setShowPayModal(false)}>Cancel</Button></div>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
};

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const initialForm = { name: '', bank_name: '', card_network: 'Visa', card_type: 'Credit', card_number: '', cvv: '', expiry_date: '', owner_name: '', limit: '', statement_date: '', payment_due_date: '', color_theme: 'gradient-1' };
  const [form, setForm] = useState(initialForm);
  const [frontImg, setFrontImg] = useState(null);
  const [backImg, setBackImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchCards(); }, []);
  const fetchCards = async () => { try { const res = await api.get('/api/cards/'); setCards(res.data); } catch (e) {} };
  
  // LIVE SYNC FIX: Keep selected card in sync with backend data updates
  useEffect(() => {
      if (selectedCard) {
          const updatedCard = cards.find(c => c.id === selectedCard.id);
          if (updatedCard && JSON.stringify(updatedCard) !== JSON.stringify(selectedCard)) { setSelectedCard(updatedCard); }
      }
  }, [cards]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (frontImg) formData.append('front_image', frontImg);
    if (backImg) formData.append('back_image', backImg);

    try {
      if(isEditing) await api.put(`/api/cards/${editId}`, formData);
      else await api.post('/api/cards/', formData);
      setShowAddModal(false); setForm(initialForm); setFrontImg(null); setBackImg(null); setIsEditing(false); setEditId(null);
      fetchCards();
    } catch (err) { alert("Failed. Check inputs."); } 
    finally { setLoading(false); }
  };

  const handleEditClick = (card) => { setForm({ ...card }); setEditId(card.id); setIsEditing(true); setShowAddModal(true); setSelectedCard(null); };
  const handleDeleteClick = async (card) => { if(confirm("Delete this card?")) { await api.delete(`/api/cards/${card.id}`); fetchCards(); setSelectedCard(null); } };
  
  const colorThemes = [{id:'gradient-1',bg:'bg-gradient-to-br from-purple-900 to-blue-900'},{id:'gradient-2',bg:'bg-gradient-to-br from-slate-900 to-black'},{id:'gradient-3',bg:'bg-gradient-to-br from-red-900 to-rose-900'},{id:'gradient-4',bg:'bg-gradient-to-br from-emerald-900 to-teal-900'},{id:'gradient-5',bg:'bg-gradient-to-br from-yellow-700 to-orange-800'},{id:'gradient-6',bg:'bg-gradient-to-br from-pink-900 to-fuchsia-900'},{id:'gradient-7',bg:'bg-gradient-to-br from-cyan-900 to-blue-800'},{id:'gradient-8',bg:'bg-gradient-to-br from-indigo-900 to-violet-900'}];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">My Wallet</h2><Button onClick={() => {setIsEditing(false); setForm(initialForm); setShowAddModal(true)}} className="rounded-full w-10 h-10 p-0 flex items-center justify-center"><Plus size={24}/></Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
            <div key={card.id} className="relative group">
                <VirtualCard card={card} isMasked={true} onClick={() => setSelectedCard(card)} />
                <button onClick={(e)=>{e.stopPropagation(); handleEditClick(card);}} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full border border-white/10 hover:bg-primary text-white transition-colors z-20"><Pencil size={14} /></button>
            </div>
        ))}
      </div>
      <CardDetailModal card={selectedCard} isOpen={!!selectedCard} onClose={()=>setSelectedCard(null)} onRefresh={fetchCards} onEdit={() => handleEditClick(selectedCard)} onDelete={() => handleDeleteClick(selectedCard)}/>
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={isEditing ? "Edit Card" : "Add New Card"}>
         <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-2 gap-4"><Input label="Nick Name" placeholder="HDFC Regalia" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required /><Input label="Bank Name" placeholder="HDFC" value={form.bank_name} onChange={e=>setForm({...form, bank_name: e.target.value})} required /></div>
            <Input label="Card Number (16 Digits)" maxLength="19" value={form.card_number} onChange={e=>setForm({...form, card_number: e.target.value})} required />
            <div className="grid grid-cols-3 gap-2"><div className="col-span-1"><Input label="CVV" maxLength="4" value={form.cvv} onChange={e=>setForm({...form, cvv: e.target.value})} /></div><div className="col-span-2"><Input label="Expiry (MM/YY)" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})} required /></div></div>
            <Input label="Owner Name" value={form.owner_name} onChange={e=>setForm({...form, owner_name: e.target.value})} required /><Input label="Total Limit" type="number" value={form.limit} onChange={e=>setForm({...form, limit: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4"><Input label="Statement Day" type="number" value={form.statement_date} onChange={e=>setForm({...form, statement_date: e.target.value})} /><Input label="Payment Due" type="number" value={form.payment_due_date} onChange={e=>setForm({...form, payment_due_date: e.target.value})} /></div>
             <div className="grid grid-cols-2 gap-4"><select className="bg-slate-900 border border-slate-700 rounded p-2 text-white" value={form.card_network} onChange={e=>setForm({...form, card_network: e.target.value})}><option>Visa</option><option>Mastercard</option><option>RuPay</option><option>Amex</option></select><select className="bg-slate-900 border border-slate-700 rounded p-2 text-white" value={form.card_type} onChange={e=>setForm({...form, card_type: e.target.value})}><option>Credit</option><option>Debit</option></select></div>
             <div className="space-y-1"><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card Theme</label><div className="grid grid-cols-8 gap-2">{colorThemes.map(theme => (<div key={theme.id} onClick={()=>setForm({...form, color_theme: theme.id})} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${form.color_theme === theme.id ? 'border-white ring-2 ring-white/50' : 'border-transparent'} ${theme.bg}`}></div>))}</div></div>
            <div className="grid grid-cols-2 gap-4 pt-2"><FileInput label="Front" onChange={e=>setFrontImg(e.target.files[0])} accept="image/*" /><FileInput label="Back" onChange={e=>setBackImg(e.target.files[0])} accept="image/*" /></div>
            <Button type="submit" className="w-full" isLoading={loading}>{isEditing ? "Update" : "Save"}</Button>
            {isEditing && <Button type="button" variant="danger" className="w-full mt-2" onClick={() => handleDeleteClick({id: editId})}>Delete Card</Button>}
         </form>
      </Modal>
    </div>
  );
};
export default Cards;