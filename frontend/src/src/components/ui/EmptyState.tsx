 import { ReactNode } from "react";
 
 interface EmptyStateProps {
   icon?: ReactNode;
   title: string;
   description?: string;
   action?: ReactNode;
 }
 
 export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
   return (
     <div className="flex flex-col items-center justify-center py-12 text-center">
       {icon && (
         <div className="mb-4 p-4 rounded-full bg-muted text-muted-foreground">
           {icon}
         </div>
       )}
       <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
       {description && (
         <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
       )}
       {action}
     </div>
   );
 }