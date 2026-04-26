import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreatorDashboardView } from "~/creator/views/creator-dashboard-view";

const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("creator_dashboard"),
    (t) => t("creator_dashboard_description"),
    undefined,
    undefined,
    "/creator"
  );

const Page = async () => {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });

  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

  return <CreatorDashboardView />;
};

export { generateMetadata };

export default Page;
