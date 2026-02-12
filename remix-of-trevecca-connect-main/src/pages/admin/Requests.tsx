 import { useState } from "react";
 import { DataTable } from "@/components/ui/DataTable";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import { SearchInput } from "@/components/ui/SearchInput";
 import { Modal } from "@/components/ui/Modal";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { FileText, Check, X, UserPlus } from "lucide-react";
 import {
   getRequestsWithDetails,
   getActiveTutors,
   getTutorsForCourse,
 } from "@/data/mockData";
 import type { TutoringRequestWithDetails, TutorWithUser } from "@/types";
 
 export default function AdminRequests() {
   const [requests, setRequests] = useState(getRequestsWithDetails());
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [selectedRequest, setSelectedRequest] = useState<TutoringRequestWithDetails | null>(null);
   const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
 
   const filteredRequests = requests.filter((request) => {
     const matchesSearch =
       request.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       request.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       request.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
       request.course.title.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesStatus =
       statusFilter === "all" || request.status === statusFilter;
 
     return matchesSearch && matchesStatus;
   });
 
   const handleApprove = (request: TutoringRequestWithDetails) => {
     setRequests((prev) =>
       prev.map((r) =>
         r.id === request.id ? { ...r, status: "approved" } : r
       )
     );
   };
 
   const handleDeny = (request: TutoringRequestWithDetails) => {
     setRequests((prev) =>
       prev.map((r) =>
         r.id === request.id ? { ...r, status: "denied" } : r
       )
     );
   };
 
   const handleAssignTutor = (tutor: TutorWithUser) => {
     if (selectedRequest) {
       setRequests((prev) =>
         prev.map((r) =>
           r.id === selectedRequest.id
             ? { ...r, requested_tutor_id: tutor.user_id, requested_tutor: tutor }
             : r
         )
       );
       setIsAssignModalOpen(false);
       setSelectedRequest(null);
     }
   };
 
   const columns = [
     {
       key: "student",
       header: "Student",
       render: (r: TutoringRequestWithDetails) => (
         <div>
           <p className="font-medium text-foreground">
             {r.user.first_name} {r.user.last_name}
           </p>
           <p className="text-xs text-muted-foreground">{r.user.email}</p>
         </div>
       ),
     },
     {
       key: "course",
       header: "Course",
       render: (r: TutoringRequestWithDetails) => (
         <div>
           <p className="font-medium text-foreground">{r.course.code}</p>
           <p className="text-xs text-muted-foreground">{r.course.title}</p>
         </div>
       ),
     },
     {
       key: "description",
       header: "Description",
       render: (r: TutoringRequestWithDetails) => (
         <p className="text-sm text-muted-foreground max-w-xs truncate">
           {r.description || "No description"}
         </p>
       ),
     },
     {
       key: "tutor",
       header: "Assigned Tutor",
       render: (r: TutoringRequestWithDetails) =>
         r.requested_tutor ? (
           <span className="text-sm text-foreground">
             {r.requested_tutor.user.first_name} {r.requested_tutor.user.last_name}
           </span>
         ) : (
           <span className="text-sm text-muted-foreground italic">Unassigned</span>
         ),
     },
     {
       key: "status",
       header: "Status",
       render: (r: TutoringRequestWithDetails) => (
         <StatusBadge status={r.status || "pending"} />
       ),
     },
     {
       key: "created_at",
       header: "Date",
       render: (r: TutoringRequestWithDetails) => (
         <span className="text-sm text-muted-foreground">
           {new Date(r.created_at).toLocaleDateString()}
         </span>
       ),
     },
     {
       key: "actions",
       header: "Actions",
       render: (r: TutoringRequestWithDetails) => (
         <div className="flex items-center gap-2">
           {r.status === "pending" && (
             <>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   handleApprove(r);
                 }}
                 className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                 title="Approve"
               >
                 <Check size={16} />
               </button>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   handleDeny(r);
                 }}
                 className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                 title="Deny"
               >
                 <X size={16} />
               </button>
             </>
           )}
           <button
             onClick={(e) => {
               e.stopPropagation();
               setSelectedRequest(r);
               setIsAssignModalOpen(true);
             }}
             className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
             title="Assign Tutor"
           >
             <UserPlus size={16} />
           </button>
         </div>
       ),
     },
   ];
 
   const availableTutors = selectedRequest
     ? getTutorsForCourse(
         getRequestsWithDetails().find((r) => r.id === selectedRequest.id)?.course.code || ""
       )
     : [];
 
   return (
     <div className="animate-fade-in">
       <h1 className="page-header">Tutoring Requests</h1>
 
       {/* Filters */}
       <div className="card-base p-4 mb-6">
         <div className="flex flex-col sm:flex-row gap-4">
           <SearchInput
             value={searchQuery}
             onChange={setSearchQuery}
             placeholder="Search by student or course..."
             className="flex-1"
           />
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="input-field w-full sm:w-40"
           >
             <option value="all">All Status</option>
             <option value="pending">Pending</option>
             <option value="approved">Approved</option>
             <option value="denied">Denied</option>
           </select>
         </div>
       </div>
 
       {/* Table */}
       <div className="card-base overflow-hidden">
         {filteredRequests.length === 0 ? (
           <EmptyState
             icon={<FileText size={40} />}
             title="No requests found"
             description="There are no tutoring requests matching your filters."
           />
         ) : (
           <DataTable
             columns={columns}
             data={filteredRequests}
             keyField="id"
           />
         )}
       </div>
 
       {/* Assign Tutor Modal */}
       <Modal
         isOpen={isAssignModalOpen}
         onClose={() => {
           setIsAssignModalOpen(false);
           setSelectedRequest(null);
         }}
         title="Assign Tutor"
         size="md"
       >
         <div className="space-y-4">
           {selectedRequest && (
             <div className="p-3 bg-muted rounded-md">
               <p className="text-sm text-muted-foreground">Assigning tutor for:</p>
               <p className="font-medium text-foreground">
                 {selectedRequest.course.code} - {selectedRequest.course.title}
               </p>
             </div>
           )}
 
           <p className="text-sm text-muted-foreground">
             Available tutors for this course:
           </p>
 
           {availableTutors.length === 0 ? (
             <p className="text-center py-4 text-muted-foreground">
               No tutors available for this course
             </p>
           ) : (
             <div className="space-y-2">
               {availableTutors.map((tutor) => (
                 <button
                   key={tutor!.user_id}
                   onClick={() => handleAssignTutor(tutor!)}
                   className="w-full p-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                 >
                   <p className="font-medium text-foreground">
                     {tutor!.user.first_name} {tutor!.user.last_name}
                   </p>
                   <p className="text-sm text-muted-foreground">
                     {tutor!.major} • {tutor!.subjects}
                   </p>
                 </button>
               ))}
             </div>
           )}
 
           <div className="flex justify-end gap-3 pt-4 border-t border-border">
             <button
               onClick={() => {
                 setIsAssignModalOpen(false);
                 setSelectedRequest(null);
               }}
               className="btn-secondary"
             >
               Cancel
             </button>
           </div>
         </div>
       </Modal>
     </div>
   );
 }