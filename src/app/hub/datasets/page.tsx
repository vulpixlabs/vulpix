import { redirect } from "next/navigation";

export default function DatasetsRedirect() {
  redirect("/hub?view=datasets");
}
