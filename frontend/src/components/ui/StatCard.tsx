 import { ReactNode } from "react";
 import { Link } from "react-router-dom";
 import { ArrowRight } from "lucide-react";
 
 interface StatCardProps {
   title: string;
   value: string | number;
   subtitle?: string;
   icon?: ReactNode;
   linkTo?: string;
   trend?: {
     value: number;
     isPositive: boolean;
   };
 }
 
 export function StatCard({ title, value, subtitle, icon, linkTo, trend }: StatCardProps) {
   const content = (
     <div className={`card-base p-6 ${linkTo ? "card-interactive" : ""}`}>
       <div className="flex items-start justify-between mb-4">
         <div>
           <p className="text-sm font-medium text-muted-foreground">{title}</p>
           <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
         </div>
         {icon && (
           <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
         )}
       </div>
 
       {(subtitle || trend) && (
         <div className="flex items-center justify-between">
           {subtitle && (
             <p className="text-sm text-muted-foreground">{subtitle}</p>
           )}
           {trend && (
             <span
               className={`text-sm font-medium ${
                 trend.isPositive ? "text-success" : "text-destructive"
               }`}
             >
               {trend.isPositive ? "+" : ""}{trend.value}%
             </span>
           )}
         </div>
       )}
 
       {linkTo && (
         <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary">
           View all <ArrowRight size={16} />
         </div>
       )}
     </div>
   );
 
   if (linkTo) {
     return <Link to={linkTo}>{content}</Link>;
   }
 
   return content;
 }