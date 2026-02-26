 interface StatusBadgeProps {
   status: string;
   variant?: "default" | "success" | "warning" | "destructive" | "muted";
 }
 
 const statusVariantMap: Record<string, StatusBadgeProps["variant"]> = {
   pending: "warning",
   pending_tutor: "warning",
   approved: "success",
   denied: "destructive",
   completed: "success",
   scheduled: "default",
   cancelled: "muted",
   active: "success",
   inactive: "muted",
 };
 
 export function StatusBadge({ status, variant }: StatusBadgeProps) {
   const autoVariant = statusVariantMap[status.toLowerCase()] || "default";
   const finalVariant = variant || autoVariant;
 
   const variantClasses = {
     default: "badge-primary",
     success: "badge-success",
     warning: "badge-warning",
     destructive: "badge-destructive",
     muted: "badge-muted",
   };
 
   const statusLabelMap: Record<string, string> = {
     pending_tutor: "Awaiting Tutor",
   };
   const key = status.toLowerCase();
   const label = statusLabelMap[key] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

   return (
     <span className={variantClasses[finalVariant]}>
       {label}
     </span>
   );
 }