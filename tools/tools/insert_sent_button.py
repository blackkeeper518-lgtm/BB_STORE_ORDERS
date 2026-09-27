from pathlib import Path

path = Path('/home/ubuntu/review_BB_STORE_ORDERS/client/src/pages/TelegramDeliveryRoom.tsx')
text = path.read_text()
needle = '<Button onClick={() => setEditMode((value) => !value)} disabled={!order} variant="outline" className="bb-status-button">'
insert = '<Button onClick={markCurrentOrderSent} disabled={!order || isSent(order)} className="border border-emerald-300/50 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"><CheckCircle2 className="mr-2 h-4 w-4" />{isSent(order) ? "ส่งแล้ว" : "ติ๊กว่าส่งแล้ว"}</Button>' + needle
if text.count(needle) != 1:
    raise SystemExit(f'expected one button anchor, found {text.count(needle)}')
path.write_text(text.replace(needle, insert, 1))
print('inserted sent button')
