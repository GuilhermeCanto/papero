import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard/finance");
  return <>Coming Soon</>;
}
