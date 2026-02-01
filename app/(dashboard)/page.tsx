import { redirect } from "next/navigation";
import { format } from "date-fns";

export default function DashboardRedirect() {
  const currentMonth = format(new Date(), "yyyy-MM");
  redirect(`/${currentMonth}`);
}
