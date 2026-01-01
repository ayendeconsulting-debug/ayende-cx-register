-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RETAIL', 'RENTAL', 'SERVICE', 'HOSPITALITY');

-- CreateEnum
CREATE TYPE "CustomerAccountType" AS ENUM ('PERSON', 'BUSINESS');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENTAL', 'SERVICE', 'HOSPITALITY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'REFUNDED', 'FORFEITED', 'APPLIED');

-- CreateEnum
CREATE TYPE "ServiceEngagementType" AS ENUM ('HOURLY', 'FIXED', 'RETAINER', 'SUBSCRIPTION');

-- CreateEnum  
CREATE TYPE "HospitalityServiceType" AS ENUM ('DINE_IN', 'TAKEOUT', 'DELIVERY', 'CATERING');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('CUSTOMER_REQUEST', 'DAMAGED_PRODUCT', 'WRONG_ITEM', 'DEFECTIVE', 'CANCELLED_SERVICE', 'LATE_RETURN', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'SERVER', 'KITCHEN', 'TECHNICIAN', 'SALES_REP', 'RENTAL_AGENT');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('NONE', 'VIEW', 'CREATE', 'EDIT', 'DELETE', 'FULL');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "business_type" "BusinessType" NOT NULL DEFAULT 'RETAIL',
    "owner_name" TEXT NOT NULL,
    "owner_email" TEXT NOT NULL,
    "owner_phone" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT DEFAULT '#10B981',
    "secondary_color" TEXT DEFAULT '#059669',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trial_ends_at" TIMESTAMP(3),
    "subscription_tier" TEXT DEFAULT 'starter',
    "externalTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessConfig" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "inventory_enabled" BOOLEAN NOT NULL DEFAULT false,
    "barcode_scanning" BOOLEAN NOT NULL DEFAULT false,
    "stock_alerts" BOOLEAN NOT NULL DEFAULT false,
    "low_stock_threshold" INTEGER DEFAULT 10,
    "rental_contracts" BOOLEAN NOT NULL DEFAULT false,
    "deposit_management" BOOLEAN NOT NULL DEFAULT false,
    "late_fee_enabled" BOOLEAN NOT NULL DEFAULT false,
    "late_fee_per_day" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "damage_fee_enabled" BOOLEAN NOT NULL DEFAULT false,
    "appointment_booking" BOOLEAN NOT NULL DEFAULT false,
    "staff_commissions" BOOLEAN NOT NULL DEFAULT false,
    "commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "time_tracking" BOOLEAN NOT NULL DEFAULT false,
    "table_management" BOOLEAN NOT NULL DEFAULT false,
    "kitchen_display" BOOLEAN NOT NULL DEFAULT false,
    "tips_enabled" BOOLEAN NOT NULL DEFAULT true,
    "split_bill_enabled" BOOLEAN NOT NULL DEFAULT true,
    "loyalty_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_receipts" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "multi_currency_enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_currency" TEXT NOT NULL DEFAULT 'NGN',
    "supported_currencies" TEXT[] DEFAULT ARRAY['NGN']::TEXT[],
    "partial_payments_enabled" BOOLEAN NOT NULL DEFAULT false,
    "min_deposit_percent" DECIMAL(5,2) DEFAULT 0,
    "tax_enabled" BOOLEAN NOT NULL DEFAULT true,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_exempt_services" BOOLEAN NOT NULL DEFAULT false,
    "refund_enabled" BOOLEAN NOT NULL DEFAULT true,
    "refund_restocking_fee" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "refund_window_days" INTEGER DEFAULT 30,
    "min_order_enabled" BOOLEAN NOT NULL DEFAULT false,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "offline_mode_enabled" BOOLEAN NOT NULL DEFAULT true,
    "offline_sync_interval" INTEGER DEFAULT 300,
    "color_theme" TEXT,
    "dashboard_widgets" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCustomer" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "account_type" "CustomerAccountType" NOT NULL DEFAULT 'PERSON',
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "business_name" TEXT,
    "business_reg_no" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "contact_person_name" TEXT,
    "contact_person_title" TEXT,
    "contact_person_phone" TEXT,
    "contact_person_email" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "loyalty_points_balance" INTEGER NOT NULL DEFAULT 0,
    "loyalty_tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
    "total_lifetime_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "last_visit" TIMESTAMP(3),
    "member_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credit_limit" DECIMAL(10,2),
    "payment_terms" TEXT DEFAULT 'IMMEDIATE',
    "outstanding_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "tax_exempt_cert" TEXT,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "preferred_contact_method" TEXT DEFAULT 'email',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "external_id" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'CASHIER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPermission" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "transaction_create" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "transaction_void" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "transaction_refund" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "rental_checkout" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "rental_checkin" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "rental_extend" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "inventory_view" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "inventory_adjust" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "customer_create" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "customer_edit" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "reports_view" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "settings_manage" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_alert" INTEGER NOT NULL DEFAULT 10,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "barcode" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "daily_rate" DECIMAL(10,2),
    "hourly_rate" DECIMAL(10,2),
    "weekly_rate" DECIMAL(10,2),
    "deposit_required" BOOLEAN NOT NULL DEFAULT true,
    "deposit_amount" DECIMAL(10,2),
    "quantity_total" INTEGER NOT NULL DEFAULT 1,
    "quantity_available" INTEGER NOT NULL DEFAULT 1,
    "min_rental_days" INTEGER DEFAULT 1,
    "max_rental_days" INTEGER,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "hourly_rate" DECIMAL(10,2),
    "fixed_price" DECIMAL(10,2),
    "estimated_duration" INTEGER,
    "requires_staff" BOOLEAN NOT NULL DEFAULT false,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "prep_time" INTEGER,
    "available_quantity" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "allergens" TEXT,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "customer_id" TEXT,
    "is_walk_in" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
    "loyalty_points_redeemed" INTEGER NOT NULL DEFAULT 0,
    "processed_by" TEXT,
    "notes" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "external_id" TEXT,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "rental_start" TIMESTAMP(3) NOT NULL,
    "rental_end" TIMESTAMP(3) NOT NULL,
    "actual_return" TIMESTAMP(3),
    "deposit_amount" DECIMAL(10,2) NOT NULL,
    "deposit_status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "late_fee_per_day" DECIMAL(10,2) DEFAULT 0,
    "late_fee_charged" DECIMAL(10,2) DEFAULT 0,
    "damage_fee" DECIMAL(10,2) DEFAULT 0,
    "damage_notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "duration_hours" DECIMAL(5,2),
    "project_name" TEXT,
    "engagement_type" "ServiceEngagementType",
    "commission_enabled" BOOLEAN NOT NULL DEFAULT false,
    "commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalityTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "table_number" TEXT,
    "server_id" TEXT,
    "service_type" "HospitalityServiceType",
    "guest_count" INTEGER,
    "order_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "served_time" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalityTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLineItem" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) DEFAULT 0,
    "discount_amount" DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "equipment_name" TEXT NOT NULL,
    "rental_period_days" INTEGER NOT NULL,
    "daily_rate" DECIMAL(10,2) NOT NULL,
    "total_rental_fee" DECIMAL(10,2) NOT NULL,
    "condition_out" TEXT,
    "condition_in" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_category" TEXT,
    "hours" DECIMAL(5,2),
    "hourly_rate" DECIMAL(10,2),
    "fixed_fee" DECIMAL(10,2),
    "line_total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalityLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "menu_item_name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "special_requests" TEXT,
    "modifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalityLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "payment_method" "PaymentMethod" NOT NULL,
    "exchange_rate" DECIMAL(10,6) DEFAULT 1,
    "amount_in_base_currency" DECIMAL(10,2),
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "restocking_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_refund" DECIMAL(10,2) NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "refund_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAssignment" (
    "id" TEXT NOT NULL,
    "service_transaction_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "hours_worked" DECIMAL(5,2),
    "commission_earned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "points_calculation_method" TEXT NOT NULL DEFAULT 'per_dollar',
    "points_per_dollar" DECIMAL(5,2) DEFAULT 1,
    "points_per_session" INTEGER DEFAULT 10,
    "points_per_transaction" INTEGER DEFAULT 5,
    "redemption_value" DECIMAL(10,4) NOT NULL DEFAULT 0.01,
    "min_points_redemption" INTEGER NOT NULL DEFAULT 100,
    "bronze_threshold" INTEGER NOT NULL DEFAULT 0,
    "silver_threshold" INTEGER NOT NULL DEFAULT 500,
    "gold_threshold" INTEGER NOT NULL DEFAULT 1000,
    "platinum_threshold" INTEGER NOT NULL DEFAULT 2500,
    "tier_benefits" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "points_redeemed" INTEGER NOT NULL DEFAULT 0,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "contentUrl" TEXT,
    "changelog" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "termsVersionId" TEXT NOT NULL,
    "acceptedBy" TEXT,
    "acceptedByEmail" TEXT NOT NULL,
    "acceptedByName" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_subdomain_key" ON "Business"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Business_externalTenantId_key" ON "Business"("externalTenantId");

-- CreateIndex
CREATE INDEX "Business_subdomain_idx" ON "Business"("subdomain");

-- CreateIndex
CREATE INDEX "Business_business_type_idx" ON "Business"("business_type");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessConfig_business_id_key" ON "BusinessConfig"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCustomer_tenant_id_email_key" ON "TenantCustomer"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCustomer_tenant_id_phone_key" ON "TenantCustomer"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "TenantCustomer_tenant_id_idx" ON "TenantCustomer"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantCustomer_email_idx" ON "TenantCustomer"("email");

-- CreateIndex
CREATE INDEX "TenantCustomer_phone_idx" ON "TenantCustomer"("phone");

-- CreateIndex
CREATE INDEX "TenantCustomer_loyalty_tier_idx" ON "TenantCustomer"("loyalty_tier");

-- CreateIndex
CREATE INDEX "TenantCustomer_account_type_idx" ON "TenantCustomer"("account_type");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_business_id_email_key" ON "Staff"("business_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_business_id_username_key" ON "Staff"("business_id", "username");

-- CreateIndex
CREATE INDEX "Staff_business_id_idx" ON "Staff"("business_id");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPermission_staff_id_key" ON "StaffPermission"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_business_id_sku_key" ON "Product"("business_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_business_id_barcode_key" ON "Product"("business_id", "barcode");

-- CreateIndex
CREATE INDEX "Product_business_id_idx" ON "Product"("business_id");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_business_id_sku_key" ON "Equipment"("business_id", "sku");

-- CreateIndex
CREATE INDEX "Equipment_business_id_idx" ON "Equipment"("business_id");

-- CreateIndex
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- CreateIndex
CREATE INDEX "Service_business_id_idx" ON "Service"("business_id");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "MenuItem_business_id_idx" ON "MenuItem"("business_id");

-- CreateIndex
CREATE INDEX "MenuItem_category_idx" ON "MenuItem"("category");

-- CreateIndex
CREATE INDEX "Transaction_business_id_idx" ON "Transaction"("business_id");

-- CreateIndex
CREATE INDEX "Transaction_customer_id_idx" ON "Transaction"("customer_id");

-- CreateIndex
CREATE INDEX "Transaction_transaction_type_idx" ON "Transaction"("transaction_type");

-- CreateIndex
CREATE INDEX "Transaction_transaction_date_idx" ON "Transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "Transaction_payment_status_idx" ON "Transaction"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "SaleTransaction_transaction_id_key" ON "SaleTransaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "SaleTransaction_receipt_number_key" ON "SaleTransaction"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "RentalTransaction_transaction_id_key" ON "RentalTransaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "RentalTransaction_contract_number_key" ON "RentalTransaction"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTransaction_transaction_id_key" ON "ServiceTransaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalityTransaction_transaction_id_key" ON "HospitalityTransaction"("transaction_id");

-- CreateIndex
CREATE INDEX "TransactionLineItem_transaction_id_idx" ON "TransactionLineItem"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "SaleLineItem_line_item_id_key" ON "SaleLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "RentalLineItem_line_item_id_key" ON "RentalLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLineItem_line_item_id_key" ON "ServiceLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalityLineItem_line_item_id_key" ON "HospitalityLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_transaction_id_idx" ON "Payment"("transaction_id");

-- CreateIndex
CREATE INDEX "Refund_transaction_id_idx" ON "Refund"("transaction_id");

-- CreateIndex
CREATE INDEX "ServiceAssignment_service_transaction_id_idx" ON "ServiceAssignment"("service_transaction_id");

-- CreateIndex
CREATE INDEX "ServiceAssignment_staff_id_idx" ON "ServiceAssignment"("staff_id");

-- CreateIndex
CREATE INDEX "Appointment_customer_id_idx" ON "Appointment"("customer_id");

-- CreateIndex
CREATE INDEX "Appointment_appointment_date_idx" ON "Appointment"("appointment_date");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_business_id_key" ON "LoyaltyProgram"("business_id");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_customer_id_idx" ON "LoyaltyTransaction"("customer_id");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_transaction_date_idx" ON "LoyaltyTransaction"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TermsVersion_version_key" ON "TermsVersion"("version");

-- AddForeignKey
ALTER TABLE "BusinessConfig" ADD CONSTRAINT "BusinessConfig_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCustomer" ADD CONSTRAINT "TenantCustomer_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPermission" ADD CONSTRAINT "StaffPermission_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "TenantCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleTransaction" ADD CONSTRAINT "SaleTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalTransaction" ADD CONSTRAINT "RentalTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTransaction" ADD CONSTRAINT "ServiceTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalityTransaction" ADD CONSTRAINT "HospitalityTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLineItem" ADD CONSTRAINT "TransactionLineItem_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLineItem" ADD CONSTRAINT "RentalLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLineItem" ADD CONSTRAINT "RentalLineItem_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLineItem" ADD CONSTRAINT "ServiceLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLineItem" ADD CONSTRAINT "ServiceLineItem_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalityLineItem" ADD CONSTRAINT "HospitalityLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalityLineItem" ADD CONSTRAINT "HospitalityLineItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_service_transaction_id_fkey" FOREIGN KEY ("service_transaction_id") REFERENCES "ServiceTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "TenantCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "TenantCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_termsVersionId_fkey" FOREIGN KEY ("termsVersionId") REFERENCES "TermsVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
