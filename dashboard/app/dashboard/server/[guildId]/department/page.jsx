import DepartmentClient from "./DepartmentClient";

export default function Page({ params }) {
  return <DepartmentClient guildId={params.guildId} />;
}
