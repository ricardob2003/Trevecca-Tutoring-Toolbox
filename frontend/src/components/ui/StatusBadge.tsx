 interface StatusBadgeProps {
   status: string;
   variant?: "default" | "success" | "warning" | "destructive" | "muted";
 }
 
 const statusVariantMap: Record<string, StatusBadgeProps["variant"]> = {
   pending: "warning",
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
 
   return (
     <span className={variantClasses[finalVariant]}>
       {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
     </span>
   );
 }