 import { ReactNode, useEffect } from "react";
 import { X } from "lucide-react";
 
 interface ModalProps {
   isOpen: boolean;
   onClose: () => void;
   title: string;
   children: ReactNode;
   size?: "sm" | "md" | "lg" | "xl";
 }
 
 export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
   useEffect(() => {
     if (isOpen) {
       document.body.style.overflow = "hidden";
     } else {
       document.body.style.overflow = "";
     }
     return () => {
       document.body.style.overflow = "";
     };
   }, [isOpen]);
 
   if (!isOpen) return null;
 
   const sizeClasses = {
     sm: "max-w-sm",
     md: "max-w-md",
     lg: "max-w-lg",
     xl: "max-w-xl",
   };
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center">
       {/* Backdrop */}
       <div
         className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
         onClick={onClose}
       />
 
       {/* Modal Content */}
       <div
         className={`
           relative bg-card rounded-lg shadow-xl w-full mx-4 
           animate-slide-in ${sizeClasses[size]}
         `}
         role="dialog"
         aria-modal="true"
         aria-labelledby="modal-title"
       >
         {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-border">
           <h2 id="modal-title" className="text-lg font-semibold text-foreground">
             {title}
           </h2>
           <button
             onClick={onClose}
             className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
             aria-label="Close modal"
           >
             <X size={20} />
           </button>
         </div>
 
         {/* Body */}
         <div className="p-4">{children}</div>
       </div>
     </div>
   );
 }