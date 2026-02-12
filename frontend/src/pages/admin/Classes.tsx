 import { useState } from "react";
 import { DataTable } from "@/components/ui/DataTable";
 import { SearchInput } from "@/components/ui/SearchInput";
 import { Modal } from "@/components/ui/Modal";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { BookOpen, Plus, Upload, Users } from "lucide-react";
 import { mockCourses, getTutorsForCourse } from "@/data/mockData";
 import type { Course, TutorWithUser } from "@/types";
 
 export default function AdminClasses() {
   const [courses, setCourses] = useState<Course[]>(mockCourses);
   const [searchQuery, setSearchQuery] = useState("");
   const [departmentFilter, setDepartmentFilter] = useState<string>("all");
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
 
   const [formData, setFormData] = useState({
     code: "",
     title: "",
     department: "",
   });
 
   const departments = [...new Set(courses.map((c) => c.department).filter(Boolean))];
 
   const filteredCourses = courses.filter((course) => {
     const matchesSearch =
       course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
       course.title.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesDepartment =
       departmentFilter === "all" || course.department === departmentFilter;
 
     return matchesSearch && matchesDepartment;
   });
 
   const handleAddCourse = () => {
     if (!formData.code || !formData.title) return;
 
     const newCourse: Course = {
       id: Math.max(...courses.map((c) => c.id)) + 1,
       code: formData.code.toUpperCase(),
       title: formData.title,
       department: formData.department || null,
     };
 
     setCourses((prev) => [...prev, newCourse]);
     setIsAddModalOpen(false);
     setFormData({ code: "", title: "", department: "" });
   };
 
   const handleImportCSV = () => {
     // TODO: Implement CSV import functionality
     alert("CSV import functionality would be implemented here.");
   };
 
   const openCourseDetail = (course: Course) => {
     setSelectedCourse(course);
     setIsDetailModalOpen(true);
   };
 
   const availableTutors = selectedCourse
     ? getTutorsForCourse(selectedCourse.code)
     : [];
 
   const columns = [
     {
       key: "code",
       header: "Code",
       render: (c: Course) => (
         <span className="font-medium text-foreground">{c.code}</span>
       ),
     },
     {
       key: "title",
       header: "Title",
       render: (c: Course) => (
         <span className="text-foreground">{c.title}</span>
       ),
     },
     {
       key: "department",
       header: "Department",
       render: (c: Course) => (
         <span className="text-muted-foreground">
           {c.department || <span className="italic">Not set</span>}
         </span>
       ),
     },
     {
       key: "tutors",
       header: "Available Tutors",
       render: (c: Course) => {
         const tutors = getTutorsForCourse(c.code);
         return (
           <div className="flex items-center gap-2">
             <Users size={16} className="text-muted-foreground" />
             <span className="text-sm text-foreground">{tutors.length}</span>
           </div>
         );
       },
     },
     {
       key: "actions",
       header: "",
       render: (c: Course) => (
         <button
           onClick={(e) => {
             e.stopPropagation();
             openCourseDetail(c);
           }}
           className="text-sm text-primary hover:underline"
         >
           View Details
         </button>
       ),
     },
   ];
 
   return (
     <div className="animate-fade-in">
       <div className="flex items-center justify-between mb-6">
         <h1 className="page-header mb-0">Classes</h1>
         <div className="flex items-center gap-3">
           <button
             onClick={handleImportCSV}
             className="btn-secondary flex items-center gap-2"
           >
             <Upload size={18} />
             Import CSV
           </button>
           <button
             onClick={() => setIsAddModalOpen(true)}
             className="btn-primary flex items-center gap-2"
           >
             <Plus size={18} />
             Add Class
           </button>
         </div>
       </div>
 
       {/* Filters */}
       <div className="card-base p-4 mb-6">
         <div className="flex flex-col sm:flex-row gap-4">
           <SearchInput
             value={searchQuery}
             onChange={setSearchQuery}
             placeholder="Search by code or title..."
             className="flex-1"
           />
           <select
             value={departmentFilter}
             onChange={(e) => setDepartmentFilter(e.target.value)}
             className="input-field w-full sm:w-48"
           >
             <option value="all">All Departments</option>
             {departments.map((dept) => (
               <option key={dept} value={dept!}>
                 {dept}
               </option>
             ))}
           </select>
         </div>
       </div>
 
       {/* Table */}
       <div className="card-base overflow-hidden">
         {filteredCourses.length === 0 ? (
           <EmptyState
             icon={<BookOpen size={40} />}
             title="No classes found"
             description="There are no classes matching your filters."
             action={
               <button
                 onClick={() => setIsAddModalOpen(true)}
                 className="btn-primary"
               >
                 Add First Class
               </button>
             }
           />
         ) : (
           <DataTable
             columns={columns}
             data={filteredCourses}
             keyField="id"
             onRowClick={openCourseDetail}
           />
         )}
       </div>
 
       {/* Add Class Modal */}
       <Modal
         isOpen={isAddModalOpen}
         onClose={() => {
           setIsAddModalOpen(false);
           setFormData({ code: "", title: "", department: "" });
         }}
         title="Add New Class"
         size="md"
       >
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Course Code *
             </label>
             <input
               type="text"
               value={formData.code}
               onChange={(e) => setFormData({ ...formData, code: e.target.value })}
               placeholder="e.g., CS101"
               className="input-field"
             />
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Title *
             </label>
             <input
               type="text"
               value={formData.title}
               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
               placeholder="e.g., Introduction to Computer Science"
               className="input-field"
             />
           </div>
 
           <div>
             <label className="block text-sm font-medium text-foreground mb-1.5">
               Department
             </label>
             <input
               type="text"
               value={formData.department}
               onChange={(e) => setFormData({ ...formData, department: e.target.value })}
               placeholder="e.g., Computer Science"
               className="input-field"
             />
           </div>
 
           <div className="flex justify-end gap-3 pt-4 border-t border-border">
             <button
               onClick={() => {
                 setIsAddModalOpen(false);
                 setFormData({ code: "", title: "", department: "" });
               }}
               className="btn-secondary"
             >
               Cancel
             </button>
             <button
               onClick={handleAddCourse}
               disabled={!formData.code || !formData.title}
               className="btn-primary disabled:opacity-50"
             >
               Add Class
             </button>
           </div>
         </div>
       </Modal>
 
       {/* Course Detail Modal */}
       <Modal
         isOpen={isDetailModalOpen}
         onClose={() => {
           setIsDetailModalOpen(false);
           setSelectedCourse(null);
         }}
         title="Class Details"
         size="lg"
       >
         {selectedCourse && (
           <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-sm text-muted-foreground">Course Code</p>
                 <p className="font-medium text-foreground">{selectedCourse.code}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Department</p>
                 <p className="font-medium text-foreground">
                   {selectedCourse.department || "Not set"}
                 </p>
               </div>
               <div className="col-span-2">
                 <p className="text-sm text-muted-foreground">Title</p>
                 <p className="font-medium text-foreground">{selectedCourse.title}</p>
               </div>
             </div>
 
             <div>
               <h3 className="section-header">Available Tutors</h3>
               {availableTutors.length === 0 ? (
                 <p className="text-muted-foreground text-sm">
                   No tutors available for this course. Tutors with "{selectedCourse.code}" 
                   in their subjects list will appear here.
                 </p>
               ) : (
                 <div className="space-y-2">
                   {availableTutors.map((tutor) => (
                     <div
                       key={tutor!.user_id}
                       className="p-3 rounded-md border border-border"
                     >
                       <p className="font-medium text-foreground">
                         {tutor!.user.first_name} {tutor!.user.last_name}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         {tutor!.major} • {tutor!.hourly_limit}h/week limit
                       </p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
 
             <div className="flex justify-end pt-4 border-t border-border">
               <button
                 onClick={() => {
                   setIsDetailModalOpen(false);
                   setSelectedCourse(null);
                 }}
                 className="btn-secondary"
               >
                 Close
               </button>
             </div>
           </div>
         )}
       </Modal>
     </div>
   );
 }