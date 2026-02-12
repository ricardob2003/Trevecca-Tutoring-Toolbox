 import { useState } from "react";
 import { DataTable } from "@/components/ui/DataTable";
 import { StatusBadge } from "@/components/ui/StatusBadge";
 import { SearchInput } from "@/components/ui/SearchInput";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { GraduationCap, UserX } from "lucide-react";
 import { mockUsers, mockTutors } from "@/data/mockData";
 import type { User } from "@/types";
 
 export default function AdminStudents() {
   // Filter out admins to show only students
   const [students, setStudents] = useState<User[]>(
     mockUsers.filter((u) => u.role !== "admin")
   );
   const [searchQuery, setSearchQuery] = useState("");
   const [yearFilter, setYearFilter] = useState<string>("all");
 
   const filteredStudents = students.filter((student) => {
     const matchesSearch =
       student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       student.trevecca_id.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesYear =
       yearFilter === "all" || student.year?.toString() === yearFilter;
 
     return matchesSearch && matchesYear;
   });
 
   const handleDeactivate = (student: User) => {
     // TODO: Schema does not support deactivating students
     // Would need to add an 'active' field to the user table
     alert(
       `Deactivate functionality requires an 'active' field on the user table. Student: ${student.first_name} ${student.last_name}`
     );
   };
 
   const isTutor = (userId: number) => {
     return mockTutors.some((t) => t.user_id === userId);
   };
 
   const columns = [
     {
       key: "student",
       header: "Student",
       render: (s: User) => (
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
             <span className="text-sm font-medium text-primary">
               {s.first_name[0]}{s.last_name[0]}
             </span>
           </div>
           <div>
             <p className="font-medium text-foreground">
               {s.first_name} {s.last_name}
               {isTutor(s.id) && (
                 <span className="ml-2 badge-primary">Tutor</span>
               )}
             </p>
             <p className="text-xs text-muted-foreground">{s.email}</p>
           </div>
         </div>
       ),
     },
     {
       key: "trevecca_id",
       header: "TNU ID",
       render: (s: User) => (
         <span className="font-mono text-sm text-foreground">{s.trevecca_id}</span>
       ),
     },
     {
       key: "year",
       header: "Year",
       render: (s: User) => {
         const yearLabels: Record<number, string> = {
           1: "Freshman",
           2: "Sophomore",
           3: "Junior",
           4: "Senior",
         };
         return (
           <span className="text-sm text-foreground">
             {s.year ? yearLabels[s.year] || `Year ${s.year}` : "—"}
           </span>
         );
       },
     },
     {
       key: "created_at",
       header: "Joined",
       render: (s: User) => (
         <span className="text-sm text-muted-foreground">
           {new Date(s.created_at).toLocaleDateString()}
         </span>
       ),
     },
     {
       key: "temp_password",
       header: "Password Status",
       render: (s: User) => (
         <StatusBadge
           status={s.temporary_password ? "Temporary" : "Set"}
           variant={s.temporary_password ? "warning" : "success"}
         />
       ),
     },
     {
       key: "actions",
       header: "Actions",
       render: (s: User) => (
         <button
           onClick={(e) => {
             e.stopPropagation();
             handleDeactivate(s);
           }}
           className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
           title="Deactivate (stub)"
         >
           <UserX size={16} />
         </button>
       ),
     },
   ];
 
   return (
     <div className="animate-fade-in">
       <h1 className="page-header">Students</h1>
 
       {/* Filters */}
       <div className="card-base p-4 mb-6">
         <div className="flex flex-col sm:flex-row gap-4">
           <SearchInput
             value={searchQuery}
             onChange={setSearchQuery}
             placeholder="Search by name, email, or ID..."
             className="flex-1"
           />
           <select
             value={yearFilter}
             onChange={(e) => setYearFilter(e.target.value)}
             className="input-field w-full sm:w-40"
           >
             <option value="all">All Years</option>
             <option value="1">Freshman</option>
             <option value="2">Sophomore</option>
             <option value="3">Junior</option>
             <option value="4">Senior</option>
           </select>
         </div>
       </div>
 
       {/* Stats */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
         <div className="card-base p-4">
           <p className="text-sm text-muted-foreground">Total Students</p>
           <p className="text-2xl font-bold text-foreground">{students.length}</p>
         </div>
         <div className="card-base p-4">
           <p className="text-sm text-muted-foreground">Student Tutors</p>
           <p className="text-2xl font-bold text-foreground">
             {students.filter((s) => isTutor(s.id)).length}
           </p>
         </div>
         <div className="card-base p-4">
           <p className="text-sm text-muted-foreground">Pending Passwords</p>
           <p className="text-2xl font-bold text-foreground">
             {students.filter((s) => s.temporary_password).length}
           </p>
         </div>
       </div>
 
       {/* Table */}
       <div className="card-base overflow-hidden">
         {filteredStudents.length === 0 ? (
           <EmptyState
             icon={<GraduationCap size={40} />}
             title="No students found"
             description="There are no students matching your filters."
           />
         ) : (
           <DataTable columns={columns} data={filteredStudents} keyField="id" />
         )}
       </div>
     </div>
   );
 }