 import { useState } from "react";
 import { DataTable } from "@/components/ui/DataTable";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import { SearchInput } from "@/components/ui/SearchInput";
 import { Modal } from "@/components/ui/Modal";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { Users, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
 import { mockTutors, mockUsers, getTutorWithUser } from "@/data/mockData";
 import type { TutorWithUser, User, Tutor } from "@/types";
 
 export default function AdminTutors() {
   const [tutors, setTutors] = useState<TutorWithUser[]>(
     mockTutors.map((t) => getTutorWithUser(t.user_id)!).filter(Boolean)
   );
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedTutor, setSelectedTutor] = useState<TutorWithUser | null>(null);
 
   // Form state
   const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
   const [formData, setFormData] = useState({
     major: "",
     subjects: "",
     hourly_limit: 20,
   });
 
   const availableUsers = mockUsers.filter(
     (u) => u.role !== "admin" && !tutors.some((t) => t.user_id === u.id)
   );
 
   const filteredTutors = tutors.filter((tutor) => {
     const matchesSearch =
       tutor.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       tutor.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       tutor.major?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       tutor.subjects?.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesStatus =
       statusFilter === "all" ||
       (statusFilter === "active" && tutor.active) ||
       (statusFilter === "inactive" && !tutor.active);
 
     return matchesSearch && matchesStatus;
   });
 
   const handleToggleActive = (tutor: TutorWithUser) => {
     setTutors((prev) =>
       prev.map((t) =>
         t.user_id === tutor.user_id ? { ...t, active: !t.active } : t
       )
     );
   };
 
   const handleCreateTutor = () => {
     if (!selectedUserId) return;
     const user = mockUsers.find((u) => u.id === selectedUserId);
     if (!user) return;
 
     const newTutor: TutorWithUser = {
       user_id: user.id,
       major: formData.major || null,
       subjects: formData.subjects || null,
       hourly_limit: formData.hourly_limit,
       active: true,
       user,
     };
 
     setTutors((prev) => [...prev, newTutor]);
     setIsCreateModalOpen(false);
     resetForm();
   };
 
   const handleEditTutor = () => {
     if (!selectedTutor) return;
 
     setTutors((prev) =>
       prev.map((t) =>
         t.user_id === selectedTutor.user_id
           ? {
               ...t,
               major: formData.major || null,
               subjects: formData.subjects || null,
               hourly_limit: formData.hourly_limit,
             }
           : t
       )
     );
     setIsEditModalOpen(false);
     setSelectedTutor(null);
     resetForm();
   };
 
   const openEditModal = (tutor: TutorWithUser) => {
     setSelectedTutor(tutor);
     setFormData({
       major: tutor.major || "",
       subjects: tutor.subjects || "",
       hourly_limit: tutor.hourly_limit || 20,
     });
     setIsEditModalOpen(true);
   };
 
   const resetForm = () => {
     setSelectedUserId(null);
     setFormData({ major: "", subjects: "", hourly_limit: 20 });
   };
 
   const columns = [
     {
       key: "tutor",
       header: "Tutor",
       render: (t: TutorWithUser) => (
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
             <span className="text-sm font-medium text-primary">
               {t.user.first_name[0]}{t.user.last_name[0]}
             </span>
           </div>
           <div>
             <p className="font-medium text-foreground">
               {t.user.first_name} {t.user.last_name}
             </p>
             <p className="text-xs text-muted-foreground">{t.user.email}</p>
           </div>
         </div>
       ),
     },
     {
       key: "major",
       header: "Major",
       render: (t: TutorWithUser) => (
         <span className="text-sm text-foreground">
           {t.major || <span className="text-muted-foreground italic">Not set</span>}
         </span>
       ),
     },
     {
       key: "subjects",
       header: "Subjects",
       render: (t: TutorWithUser) => (
         <div className="flex flex-wrap gap-1">
           {t.subjects?.split(",").map((s) => (
             <span key={s} className="badge-primary">
               {s.trim()}
             </span>
           )) || <span className="text-muted-foreground italic text-sm">None</span>}
         </div>
       ),
     },
     {
       key: "hourly_limit",
       header: "Hours/Week",
       render: (t: TutorWithUser) => (
         <span className="text-sm text-foreground">{t.hourly_limit || "—"}</span>
       ),
     },
     {
       key: "status",
       header: "Status",
       render: (t: TutorWithUser) => (
         <StatusBadge status={t.active ? "active" : "inactive"} />
       ),
     },
     {
       key: "actions",
       header: "Actions",
       render: (t: TutorWithUser) => (
         <div className="flex items-center gap-2">
           <button
             onClick={(e) => {
               e.stopPropagation();
               openEditModal(t);
             }}
             className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
             title="Edit"
           >
             <Edit size={16} />
           </button>
           <button
             onClick={(e) => {
               e.stopPropagation();
               handleToggleActive(t);
             }}
             className={`p-1.5 rounded-md transition-colors ${
               t.active
                 ? "bg-success/10 text-success hover:bg-success/20"
                 : "bg-muted text-muted-foreground hover:bg-muted/80"
             }`}
             title={t.active ? "Deactivate" : "Activate"}
           >
             {t.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
           </button>
         </div>
       ),
     },
   ];
 
   return (
     <div className="animate-fade-in">
       <div className="flex items-center justify-between mb-6">
         <h1 className="page-header mb-0">Tutors</h1>
         <button
           onClick={() => setIsCreateModalOpen(true)}
           className="btn-primary flex items-center gap-2"
         >
           <Plus size={18} />
           Add Tutor
         </button>
       </div>
 
       {/* Filters */}
       <div className="card-base p-4 mb-6">
         <div className="flex flex-col sm:flex-row gap-4">
           <SearchInput
             value={searchQuery}
             onChange={setSearchQuery}
             placeholder="Search by name, major, or subject..."
             className="flex-1"
           />
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="input-field w-full sm:w-40"
           >
             <option value="all">All Status</option>
             <option value="active">Active</option>
             <option value="inactive">Inactive</option>
           </select>
         </div>
       </div>
 
       {/* Table */}
       <div className="card-base overflow-hidden">
         {filteredTutors.length === 0 ? (
           <EmptyState
             icon={<Users size={40} />}
             title="No tutors found"
             description="There are no tutors matching your filters."
             action={
               <button
                 onClick={() => setIsCreateModalOpen(true)}
                 className="btn-primary"
               >
                 Add First Tutor
               </button>
             }
           />
         ) : (
           <DataTable columns={columns} data={filteredTutors} keyField="user_id" />
         )}
       </div>
 
       {/* Create Tutor Modal */}
       <Modal
         isOpen={isCreateModalOpen}
         onClose={() => {
           setIsCreateModalOpen(false);
           resetForm();
         }}
         title="Add New Tutor"
         size="md"
       >
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Select Student
             </label>
             <select
               value={selectedUserId || ""}
               onChange={(e) => setSelectedUserId(Number(e.target.value))}
               className="input-field"
             >
               <option value="">Choose a student...</option>
               {availableUsers.map((user) => (
                 <option key={user.id} value={user.id}>
                   {user.first_name} {user.last_name} ({user.email})
                 </option>
               ))}
             </select>
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Major
             </label>
             <input
               type="text"
               value={formData.major}
               onChange={(e) => setFormData({ ...formData, major: e.target.value })}
               placeholder="e.g., Computer Science"
               className="input-field"
             />
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Subjects (comma-separated course codes)
             </label>
             <input
               type="text"
               value={formData.subjects}
               onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
               placeholder="e.g., CS101, CS201, MATH101"
               className="input-field"
             />
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Weekly Hour Limit
             </label>
             <input
               type="number"
               value={formData.hourly_limit}
               onChange={(e) =>
                 setFormData({ ...formData, hourly_limit: Number(e.target.value) })
               }
               min={1}
               max={40}
               className="input-field"
             />
           </div>
 
           <div className="flex justify-end gap-3 pt-4 border-t border-border">
             <button
               onClick={() => {
                 setIsCreateModalOpen(false);
                 resetForm();
               }}
               className="btn-secondary"
             >
               Cancel
             </button>
             <button
               onClick={handleCreateTutor}
               disabled={!selectedUserId}
               className="btn-primary disabled:opacity-50"
             >
               Create Tutor
             </button>
           </div>
         </div>
       </Modal>
 
       {/* Edit Tutor Modal */}
       <Modal
         isOpen={isEditModalOpen}
         onClose={() => {
           setIsEditModalOpen(false);
           setSelectedTutor(null);
           resetForm();
         }}
         title="Edit Tutor"
         size="md"
       >
         <div className="space-y-4">
           {selectedTutor && (
             <div className="p-3 bg-muted rounded-md">
               <p className="font-medium text-foreground">
                 {selectedTutor.user.first_name} {selectedTutor.user.last_name}
               </p>
               <p className="text-sm text-muted-foreground">{selectedTutor.user.email}</p>
             </div>
           )}
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Major
             </label>
             <input
               type="text"
               value={formData.major}
               onChange={(e) => setFormData({ ...formData, major: e.target.value })}
               placeholder="e.g., Computer Science"
               className="input-field"
             />
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Subjects (comma-separated course codes)
             </label>
             <input
               type="text"
               value={formData.subjects}
               onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
               placeholder="e.g., CS101, CS201, MATH101"
               className="input-field"
             />
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Weekly Hour Limit
             </label>
             <input
               type="number"
               value={formData.hourly_limit}
               onChange={(e) =>
                 setFormData({ ...formData, hourly_limit: Number(e.target.value) })
               }
               min={1}
               max={40}
               className="input-field"
             />
           </div>
 
           <div className="flex justify-end gap-3 pt-4 border-t border-border">
             <button
               onClick={() => {
                 setIsEditModalOpen(false);
                 setSelectedTutor(null);
                 resetForm();
               }}
               className="btn-secondary"
             >
               Cancel
             </button>
             <button onClick={handleEditTutor} className="btn-primary">
               Save Changes
             </button>
           </div>
         </div>
       </Modal>
     </div>
   );
 }