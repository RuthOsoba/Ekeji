# Seller-only delivery updates, with tracking the buyer can follow

## What's wrong today
On the order page, a buyer of a sample outfit gets the seller's buttons ("Generate shipping label", "Mark parcel as dropped off"), and every order shows "Mark in transit" / "Mark delivered" controls to both people. The tracking number is also made up by the app rather than entered by the seller.

## What changes

**Buyer sees (read-only)**
- The delivery timeline, updated as the parcel moves.
- The courier name and tracking number, with a "Track with Royal Mail" / "Track with Evri" link that opens the courier's own tracking page.
- Once delivered: the 48-hour window, "Everything's fine — complete order" and "Report an issue" (these stay with the buyer).
- No label, drop-off, in-transit or delivered buttons.

**Seller does**
- "Print postage label" (still a placeholder label at this stage).
- "Mark as dropped off": a small form asking for the courier's tracking number (checked for the right format, e.g. Royal Mail `AB123456789GB`). Saving it tells the buyer their parcel is on its way.
- No manual "in transit" or "delivered" buttons — those updates come from the courier.

**Automatic delivery updates**
- After the tracking number is saved, the order moves to In transit and then Delivered on its own, the way it would with a courier connection. For now this is simulated (in transit shortly after drop-off, delivered a little later), because real Royal Mail and Evri tracking connections need a business account and access details from you.
- When you have a Royal Mail (Click & Drop / Tracking) or Evri business account, the same step can be switched to read the real courier status — I'd ask you for the access details then.

**Sample outfits**
- As they have no real seller, the seller steps run automatically on a short timer after purchase (label, drop-off with a sample tracking number), so buyers can still see the full journey without pressing seller buttons.

**Safety**
- The database will also block a buyer from changing delivery details, so this can't be bypassed from outside the app.

## Technical details
- `orders`: add `courier` text; tracking format validation per courier.
- Replace the broad "parties update" rule with: seller may set stage 1–2, `tracking_number`, `courier`; buyer may only set stage 5→6 and `issue_type`/`issue_details`. Enforced via a BEFORE UPDATE trigger checking `auth.uid()` against columns changed.
- Simulated courier: server function `syncTracking(orderId)` called when the order page loads/polls; advances stage 2→3 after ~2 min and 3→5 after ~5 min based on `updated_at`, sets `delivered_at`. Demo-seller orders auto-advance 0→1→2 the same way with `fakeTracking()`. Later swappable for real courier API calls.
- `orders.$id.tsx`: remove `canActAsSeller` buyer path and "Preview controls"; add tracking-number dialog and courier tracking link; poll every 15s.
