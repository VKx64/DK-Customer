# PocketBase Schema Update Required

## Order Cancellation Feature - Database Changes

To enable the order cancellation feature, you need to update your PocketBase `user_order` collection with the following changes:

### 1. Add "cancelled" to Status Field

Update the `status` field in the `user_order` collection to include the new "cancelled" option:

**Current values:**
- Pending
- Declined
- Approved
- packing
- ready_for_delivery
- on_the_way
- completed
- ready_for_pickup

**Add this value:**
- **cancelled**

### 2. Add Cancellation Reason Field

Add a new field to store the cancellation reason:

**Field Name:** `cancellation_reason`
**Field Type:** Text
**Settings:**
- Required: No (optional)
- Min Length: 10 characters
- Max Length: 500 characters (or as needed)

### How to Apply These Changes in PocketBase:

#### Option 1: Using PocketBase Admin UI
1. Log in to your PocketBase Admin UI
2. Navigate to Collections → `user_order`
3. Click on the `status` field to edit it
4. Add "cancelled" to the list of values
5. Click "Add Field" to create a new text field:
   - Name: `cancellation_reason`
   - Type: Text
   - Make it optional (not required)
6. Save the changes

#### Option 2: Using PocketBase Migrations
If you prefer to use migrations, create a migration file with the following changes to the collection schema.

### Expected Schema After Update:

```json
{
  "name": "user_order",
  "fields": [
    // ... existing fields ...
    {
      "name": "status",
      "type": "select",
      "values": [
        "Pending",
        "Declined",
        "Approved",
        "packing",
        "ready_for_delivery",
        "on_the_way",
        "completed",
        "ready_for_pickup",
        "cancelled"  // ← NEW
      ]
    },
    {
      "name": "cancellation_reason",  // ← NEW FIELD
      "type": "text",
      "required": false,
      "min": 10,
      "max": 500
    }
    // ... other fields ...
  ]
}
```

## Feature Summary

Once the schema is updated, users will be able to:

✅ Cancel orders that haven't been shipped yet (before "on_the_way" status)
✅ Select from 8 common cancellation reasons or write their own
✅ Provide a reason for cancellation (minimum 10 characters)
✅ View cancelled orders with their cancellation reason in the order history
✅ See clear visual indication of cancelled orders in the order status tracker

### Common Cancellation Reasons Provided:
1. Changed my mind about the purchase
2. Found a better price elsewhere
3. Ordered by mistake
4. Delivery time is too long
5. Need to change delivery address
6. Product specifications don't meet my needs
7. Financial reasons
8. No longer need the product

### Orders that CAN be cancelled:
- Pending
- Approved
- packing
- ready_for_delivery
- ready_for_pickup

### Orders that CANNOT be cancelled:
- on_the_way (already shipped)
- completed (already delivered)
- cancelled (already cancelled)
- Declined (already declined by admin)
