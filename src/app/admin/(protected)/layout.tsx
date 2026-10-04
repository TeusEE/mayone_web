import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await requireAdminPage();

  return (
    <>
      <AdminNavigation email={identity.email} />
      {children}
    </>
  );
}
