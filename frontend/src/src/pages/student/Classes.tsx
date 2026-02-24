 import { useState } from "react";
 import { SearchInput } from "@/components/ui/SearchInput";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { Modal } from "@/components/ui/Modal";
 import { BookOpen, Users, ArrowRight } from "lucide-react";
 import { mockCourses, getTutorsForCourse } from "@/data/mockData";
 import type { Course, TutorWithUser } from "@/types";
 import { Link } from "react-router-dom";
 
 export default function StudentClasses() {
   const [searchQuery, setSearchQuery] = useState("");
   const [departmentFilter, setDepartmentFilter] = useState<string>("all");
   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
 
   const departments = [...new Set(mockCourses.map((c) => c.department).filter(Boolean))];
 
   const filteredCourses = mockCourses.filter((course) => {
     const matchesSearch =
       course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
       course.title.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesDepartment =
       departmentFilter === "all" || course.department === departmentFilter;
 
     return matchesSearch && matchesDepartment;
   });
 
   const openCourseModal = (course: Course) => {
     setSelectedCourse(course);
     setIsModalOpen(true);
   };
 
   const availableTutors = selectedCourse
     ? getTutorsForCourse(selectedCourse.code)
     : [];
 
   return (
     <div className="animate-fade-in">
       <h1 className="page-header">Browse Classes</h1>
 
       {/* Filters */}
       <div className="card-base p-4 mb-6">
         <div className="flex flex-col sm:flex-row gap-4">
           <SearchInput
             value={searchQuery}
             onChange={setSearchQuery}
             placeholder="Search by course code or title..."
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
 
       {/* Course Grid */}
       {filteredCourses.length === 0 ? (
         <EmptyState
           icon={<BookOpen size={40} />}
           title="No classes found"
           description="Try adjusting your search or filter criteria."
         />
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {filteredCourses.map((course) => {
             const tutorCount = getTutorsForCourse(course.code).length;
             return (
               <div
                 key={course.id}
                 className="card-interactive p-5"
                 onClick={() => openCourseModal(course)}
               >
                 <div className="flex items-start justify-between mb-3">
                   <div>
                     <h3 className="font-semibold text-foreground">{course.code}</h3>
                     <p className="text-sm text-muted-foreground">{course.department}</p>
                   </div>
                   <div className="flex items-center gap-1 text-sm text-muted-foreground">
                     <Users size={16} />
                     <span>{tutorCount}</span>
                   </div>
                 </div>
                 <p className="text-foreground mb-4">{course.title}</p>
                 <div className="flex items-center gap-1 text-sm font-medium text-primary">
                   View tutors <ArrowRight size={14} />
                 </div>
               </div>
             );
           })}
         </div>
       )}
 
       {/* Course Detail Modal */}
       <Modal
         isOpen={isModalOpen}
         onClose={() => {
           setIsModalOpen(false);
           setSelectedCourse(null);
         }}
         title={selectedCourse?.code || "Course Details"}
         size="lg"
       >
         {selectedCourse && (
           <div className="space-y-6">
             <div>
               <p className="text-sm text-muted-foreground">Course Title</p>
               <p className="font-medium text-foreground text-lg">
                 {selectedCourse.title}
               </p>
               <p className="text-sm text-muted-foreground mt-1">
                 {selectedCourse.department}
               </p>
             </div>
 
             <div>
               <h3 className="section-header">Available Tutors</h3>
               {availableTutors.length === 0 ? (
                 <div className="text-center py-6 bg-muted rounded-md">
                   <p className="text-muted-foreground mb-4">
                     No tutors are currently available for this course.
                   </p>
                   <p className="text-sm text-muted-foreground">
                     You can still request tutoring — an admin will help match you.
                   </p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {availableTutors.map((tutor) => (
                     <div
                       key={tutor!.user_id}
                       className="p-4 rounded-md border border-border"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                           <span className="text-sm font-medium text-primary">
                             {tutor!.user.first_name[0]}{tutor!.user.last_name[0]}
                           </span>
                         </div>
                         <div>
                           <p className="font-medium text-foreground">
                             {tutor!.user.first_name} {tutor!.user.last_name}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {tutor!.major} • Year {tutor!.user.year || "?"}
                           </p>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
 
             <div className="flex justify-end gap-3 pt-4 border-t border-border">
               <button
                 onClick={() => {
                   setIsModalOpen(false);
                   setSelectedCourse(null);
                 }}
                 className="btn-secondary"
               >
                 Close
               </button>
               <Link
                 to="/student/request"
                 className="btn-primary"
                 onClick={() => setIsModalOpen(false)}
               >
                 Request Tutoring
               </Link>
             </div>
           </div>
         )}
       </Modal>
     </div>
   );
 }