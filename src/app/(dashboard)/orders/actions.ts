"use server";

import { z } from "zod";
import { conversationSummaryToOrderStatus, ConversationSummaryToOrderStatusInput } from "@/ai/flows/conversation-summary-to-order-status";
import { syncGoogleSheet } from "@/ai/flows/sync-google-sheet";
import { assignVendor, AssignVendorInput } from "@/ai/flows/assign-vendor-flow";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(input: ConversationSummaryToOrderStatusInput) {
    try {
        const result = await conversationSummaryToOrderStatus(input);
        
        console.log("AI-suggested update:", result);

        revalidatePath("/orders");

        return {
            success: true,
            data: result,
            message: "Order status analysis complete.",
        };

    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to update order status.",
        }
    }
}


export async function syncOrdersAction() {
    try {
        const result = await syncGoogleSheet({ sheetId: "USER_CONFIGURED_SHEET_ID" });
        
        revalidatePath("/orders");

        return {
            success: true,
            data: result.leads,
            message: `Synced ${result.leads.length} new leads from Google Sheets.`
        };
    } catch (error) {
        console.error("Error syncing with Google Sheets:", error);
        return {
            success: false,
            message: "An error occurred while syncing with Google Sheets.",
        }
    }
}

export async function assignVendorToAction(input: AssignVendorInput) {
    try {
        const result = await assignVendor(input);

        // In a real app, you would now update your database with the assigned vendor.
        // For now, we'll just log it and return the vendor data.
        console.log(`Vendor ${result.id} assigned to order ${input.orderId}`);
        
        revalidatePath("/orders");

        return {
            success: true,
            vendor: result,
        }

    } catch (error: any) {
        console.error(`Error assigning vendor for order ${input.orderId}:`, error);
        return {
            success: false,
            message: error.message || "An unexpected error occurred during vendor assignment.",
        }
    }
}
