import { withApiObservability } from '../../../src/lib/observability/apiObservability.js';
import { handleOrdersGet } from '../../../src/server/orders/controllers/ordersGetController';
import { handleOrdersPost } from '../../../src/server/orders/controllers/ordersPostController';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withApiObservability(handleOrdersGet);
export const POST = withApiObservability(handleOrdersPost);
