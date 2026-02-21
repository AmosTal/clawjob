import { getRecentApplications } from "@/lib/db";
import { apiSuccess, requireAdmin, handleError } from "@/lib/api-utils";

const ADMIN_CACHE = { "Cache-Control": "private, s-maxage=30" };

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const applications = await getRecentApplications(10);
    return apiSuccess({ applications }, 200, ADMIN_CACHE);
  } catch (err) {
    return handleError(err, "GET /api/admin/stats/recent");
  }
}
