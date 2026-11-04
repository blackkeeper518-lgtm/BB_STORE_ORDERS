// REMOVE THIS TIME GATE from DRAKSIDE WARNING ROUTER
// The first node already provides order_time from Facebook.
// The SQL delivery queue is responsible for the 14:00 cutoff.

// DELETE lines/blocks equivalent to:
// const nowBKK = ...;
// const cutoffYesterday14 = ...;
// function getOrderTimestamp(row) { ... }
// const orderTimestamp = getOrderTimestamp(j);
// if (orderTimestamp > 0 && orderTimestamp < cutoffYesterday14) continue;

// Keep the rest of the router unchanged.
// It may still use order_time only for display/routing color:
const orderDate = parseOrderDate(j.order_time);
const orderDayName = orderDate ? dayNames[orderDate.getDay()] : todayDayName;

// Do not assign a new order_time here.
// Do not fallback to created_at for cutoff decisions.
// Do not drop an item with `continue` based on time.
