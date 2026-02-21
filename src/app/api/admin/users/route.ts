import { getAllUsers } from "@/lib/db";
import {
  apiSuccess,
  requireAdmin,
  parsePageParams,
  handleError,
} from "@/lib/api-utils";

const ADMIN_CACHE = { "Cache-Control": "private, s-maxage=30" };

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { limit, offset } = parsePageParams(
      new URL(request.url).searchParams
    );

    const result = await getAllUsers(limit, offset);
    return apiSuccess(
      {
        ...result,
        pagination: { total: result.total, limit, offset },
      },
      200,
      ADMIN_CACHE
    );
  } catch (err) {
    return handleError(err, "GET /api/admin/users");
  }
}
