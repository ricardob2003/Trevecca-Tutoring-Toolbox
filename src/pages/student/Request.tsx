 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { useAuth } from "@/context/AuthContext";
 import { SearchInput } from "@/components/ui/SearchInput";
 import { mockCourses, getActiveTutors, getTutorsForCourse } from "@/data/mockData";
 import type { Course, TutorWithUser } from "@/types";
 import { ArrowLeft, Check, Users } from "lucide-react";
 
 export default function StudentRequest() {
   const { currentUser } = useAuth();
   const navigate = useNavigate();
 
   const [step, setStep] = useState(1);
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
   const [selectedTutor, setSelectedTutor] = useState<TutorWithUser | null>(null);
   const [description, setDescription] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
 
   const filteredCourses = mockCourses.filter(
     (course) =>
       course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
       course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       course.department?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   const availableTutors = selectedCourse
     ? getTutorsForCourse(selectedCourse.code)
     : [];
 
   const handleSubmit = async () => {
     if (!selectedCourse) return;
 
     setIsSubmitting(true);
     // Simulate API call
     await new Promise((resolve) => setTimeout(resolve, 1000));
 
     // In a real app, this would create a tutoring_request record
     console.log("Creating tutoring request:", {
       user_id: currentUser?.user.id,
       course_id: selectedCourse.id,
       requested_tutor_id: selectedTutor?.user_id || null,
       description,
       status: "pending",
     });
 
     setIsSubmitting(false);
     setIsSuccess(true);
   };
 
   if (isSuccess) {
     return (
       <div className="animate-fade-in max-w-2xl mx-auto">
         <div className="card-base p-8 text-center">
           <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
             <Check size={32} className="text-success" />
           </div>
           <h1 className="text-2xl font-bold text-foreground mb-2">
             Request Submitted!
           </h1>
           <p className="text-muted-foreground mb-6">
             Your tutoring request for <strong>{selectedCourse?.code}</strong> has been
             submitted. You'll be notified once an admin reviews your request.
           </p>
           <div className="flex justify-center gap-4">
             <button
               onClick={() => navigate("/student/home")}
               className="btn-primary"
             >
               Return Home
             </button>
             <button
               onClick={() => {
                 setIsSuccess(false);
                 setStep(1);
                 setSelectedCourse(null);
                 setSelectedTutor(null);
                 setDescription("");
               }}
               className="btn-secondary"
             >
               New Request
             </button>
           </div>
         </div>
       </div>
     );
   }
 
   return (
     <div className="animate-fade-in max-w-3xl mx-auto">
       <h1 className="page-header">Request a Tutor</h1>
 
       {/* Progress Steps */}
       <div className="flex items-center gap-2 mb-8">
         {[1, 2, 3].map((s) => (
           <div key={s} className="flex items-center">
             <div
               className={`
                 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                 ${step >= s
                   ? "bg-primary text-primary-foreground"
                   : "bg-muted text-muted-foreground"
                 }
               `}
             >
               {s}
             </div>
             {s < 3 && (
               <div
                 className={`w-16 h-1 mx-2 ${
                   step > s ? "bg-primary" : "bg-muted"
                 }`}
               />
             )}
           </div>
         ))}
         <span className="ml-4 text-sm text-muted-foreground">
           {step === 1 && "Select Course"}
           {step === 2 && "Choose Tutor (Optional)"}
           {step === 3 && "Add Details"}
         </span>
       </div>
 
       {/* Step 1: Select Course */}
       {step === 1 && (
         <div className="card-base p-6">
           <h2 className="section-header">Which course do you need help with?</h2>
 
           <SearchInput
             value={searchQuery}
             onChange={setSearchQuery}
             placeholder="Search by course code, title, or department..."
             className="mb-6"
           />
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
             {filteredCourses.map((course) => {
               const tutorCount = getTutorsForCourse(course.code).length;
               return (
                 <button
                   key={course.id}
                   onClick={() => {
                     setSelectedCourse(course);
                     setStep(2);
                   }}
                   className={`
                     p-4 rounded-md border text-left transition-all
                     ${selectedCourse?.id === course.id
                       ? "border-primary bg-primary/5"
                       : "border-border hover:border-primary/50 hover:bg-muted/50"
                     }
                   `}
                 >
                   <p className="font-medium text-foreground">{course.code}</p>
                   <p className="text-sm text-muted-foreground">{course.title}</p>
                   <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                     <Users size={12} />
                     <span>{tutorCount} tutor{tutorCount !== 1 ? "s" : ""} available</span>
                   </div>
                 </button>
               );
             })}
           </div>
         </div>
       )}
 
       {/* Step 2: Select Tutor (Optional) */}
       {step === 2 && selectedCourse && (
         <div className="card-base p-6">
           <div className="flex items-center gap-4 mb-6">
             <button
               onClick={() => setStep(1)}
               className="p-2 rounded-md hover:bg-muted transition-colors"
             >
               <ArrowLeft size={20} />
             </button>
             <div>
               <h2 className="section-header mb-0">
                 Choose a Tutor for {selectedCourse.code}
               </h2>
               <p className="text-sm text-muted-foreground">
                 This is optional — you can skip if you don't have a preference
               </p>
             </div>
           </div>
 
           {availableTutors.length === 0 ? (
             <div className="text-center py-8">
               <p className="text-muted-foreground mb-4">
                 No tutors are currently available for {selectedCourse.code}.
               </p>
               <button onClick={() => setStep(3)} className="btn-primary">
                 Continue Without Tutor
               </button>
             </div>
           ) : (
             <>
               <div className="space-y-3 mb-6">
                 {availableTutors.map((tutor) => (
                   <button
                     key={tutor!.user_id}
                     onClick={() => setSelectedTutor(tutor)}
                     className={`
                       w-full p-4 rounded-md border text-left transition-all
                       ${selectedTutor?.user_id === tutor!.user_id
                         ? "border-primary bg-primary/5"
                         : "border-border hover:border-primary/50 hover:bg-muted/50"
                       }
                     `}
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
                           {tutor!.major} • Year {tutor!.user.year}
                         </p>
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
 
               <div className="flex justify-between">
                 <button
                   onClick={() => {
                     setSelectedTutor(null);
                     setStep(3);
                   }}
                   className="btn-ghost"
                 >
                   Skip — No Preference
                 </button>
                 <button
                   onClick={() => setStep(3)}
                   disabled={!selectedTutor}
                   className="btn-primary disabled:opacity-50"
                 >
                   Continue
                 </button>
               </div>
             </>
           )}
         </div>
       )}
 
       {/* Step 3: Add Details */}
       {step === 3 && selectedCourse && (
         <div className="card-base p-6">
           <div className="flex items-center gap-4 mb-6">
             <button
               onClick={() => setStep(2)}
               className="p-2 rounded-md hover:bg-muted transition-colors"
             >
               <ArrowLeft size={20} />
             </button>
             <h2 className="section-header mb-0">Add Details</h2>
           </div>
 
           {/* Summary */}
           <div className="p-4 bg-muted rounded-md mb-6">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-sm text-muted-foreground">Course</p>
                 <p className="font-medium text-foreground">
                   {selectedCourse.code} - {selectedCourse.title}
                 </p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Requested Tutor</p>
                 <p className="font-medium text-foreground">
                   {selectedTutor
                     ? `${selectedTutor.user.first_name} ${selectedTutor.user.last_name}`
                     : "No preference"}
                 </p>
               </div>
             </div>
           </div>
 
           <div className="mb-6">
             <label className="block text-sm font-medium text-foreground mb-1.5">
               What do you need help with?
             </label>
             <textarea
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Describe what topics or concepts you're struggling with, or what you'd like to review..."
               rows={4}
               className="input-field resize-none"
             />
             <p className="text-xs text-muted-foreground mt-1.5">
               Be specific — this helps tutors prepare for your session.
             </p>
           </div>
 
           <div className="flex justify-end gap-3">
             <button
               onClick={() => navigate("/student/home")}
               className="btn-secondary"
             >
               Cancel
             </button>
             <button
               onClick={handleSubmit}
               disabled={isSubmitting}
               className="btn-primary"
             >
               {isSubmitting ? "Submitting..." : "Submit Request"}
             </button>
           </div>
         </div>
       )}
     </div>
   );
 }