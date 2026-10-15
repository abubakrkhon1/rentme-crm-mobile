export type StaffRole = "owner" | "admin" | "manager" | "staff" | "viewer";

export type Capability =
  | "bookings:read"
  | "bookings:write"
  | "customers:read"
  | "customers:write"
  | "transactions:read"
  | "transactions:write"
  | "inspections:write"
  | "messages:read"
  | "messages:write";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: StaffRole;
};

export type MobileSession = {
  user: { id: string; email: string; fullName: string | null };
  activeWorkspace: Workspace;
  workspaces: Workspace[];
  capabilities: Capability[];
};

export type OrganizationSettings = {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  status: "onboarding" | "trial" | "active";
  role: StaffRole;
  timezone: string;
  currencyCode: string;
  countryCode: string;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  logoUrl: string | null;
  hostname: string | null;
};

export type OrganizationSettingsResponse = { organization: OrganizationSettings; organizations: OrganizationSettings[]; canManage: boolean };
export type OrganizationSettingsInput = Pick<OrganizationSettings, "name" | "legalName" | "contactEmail" | "contactPhone" | "websiteUrl" | "bookingUrl" | "timezone" | "currencyCode">;

export type BookingSummary = {
  id: string;
  customerName: string;
  vehicleName: string;
  pickupAt: string;
  returnAt: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  phone: string | null;
};

export type TodaySummary = {
  date: string;
  pickups: BookingSummary[];
  returns: BookingSummary[];
  overdue: BookingSummary[];
  pendingCount: number;
  unreadConversationCount: number;
};

export type BookingListResponse = {
  items: BookingSummary[];
  nextCursor: string | null;
};

export type NewBookingSetup = {
  bookingId: string;
  vehicles: { id: string; name: string; plateNumber: string | null; dailyRate: number; odometer: number | null; status: string }[];
  admins: { id: string; name: string; role: string }[];
  defaultDeposit: number;
};

export type NewBookingPayload = { booking: Record<string, unknown>; inspection: InspectionInput };

export type FinishBookingSetup = {
  booking: { id: string; car_id: string; car_name: string; first_name: string; last_name: string; pickup_date: string; return_date: string; status: string };
  pickupInspection: { fuel_level: number; odometer_miles: number; allowed_miles: number | null } | null;
};

export type FinishBookingPayload = {
  returnFuelLevel: number;
  returnOdometerMiles: number;
  exteriorCondition: string;
  interiorCondition: string;
  damageNotes: string;
  generalNotes: string;
  photoPaths: string[];
};

export type BookingDetail = {
  id: string;
  customer: { name: string; email: string | null; phone: string | null; driverLicense: string | null };
  vehicle: { id: string | null; name: string; plateNumber: string | null };
  pickupAt: string;
  returnAt: string;
  pickupLocation: string | null;
  returnLocation: string | null;
  rentalDays: number;
  dailyRate: number;
  totalCost: number;
  insuranceTotal: number;
  deposit: number;
  status: string;
  paymentType: string | null;
  insuranceType: string | null;
  specialRequests: string | null;
  createdAt: string | null;
};

export type BookingOverview = {
  customerId: string | null;
  transactions: BookingTransaction[];
};

export type BalanceSummary = {
  rentalBalanceOwed: number;
  customerCredit: number;
  requiredDeposit: number;
  collectedDeposit: number;
  appliedDeposit: number;
  refundedDeposit: number;
  refundableBalance: number;
  requiredRemaining: number;
  depositStatus: string;
};

export type CustomerOverview = { balanceSummary: BalanceSummary; transactions: BookingTransaction[] };
export type CustomerTransactions = { transactions: BookingTransaction[] };
export type CustomerDocuments = { documents: CustomerDocumentSummary[] };

export type BookingDocuments = {
  documents: CustomerDocumentSummary[];
};

export type BookingTransaction = { id: string; title: string | null; category: string | null; type: string | null; method: string | null; notes: string | null; transaction_date: string; amount: number; created_at: string | null };
export type CustomerDocumentSummary = { id: string; type: string; fileName: string; mimeType: string; fileSize: number; createdAt: string; url: string | null };

export type InspectionInput = { car_id: string; fuel_level: number; odometer_miles: number; allowed_miles?: number | null; exterior_condition?: string | null; interior_condition?: string | null; damage_notes?: string | null; general_notes?: string | null; photo_paths: string[] };
export type BookingExtensionSetup = {
  parent: Record<string, unknown> & { id: string; car_id: string; car_name: string; first_name: string; last_name: string; pickup_date: string; return_date: string; daily_rate: number; insurance_total: number; rental_days: number; ride_share_fee?: number; has_own_insurance?: string };
  parentPickupInspection: { fuel_level: number; odometer_miles: number; allowed_miles: number | null; exterior_condition: string | null; interior_condition: string | null; damage_notes: string | null; general_notes: string | null; photo_paths: string[] } | null;
  parentPickupPhotoUrls: Record<string, string>;
  vehicles: VehicleSummary[];
};

export type CustomerSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  balance: number;
  createdAt: string;
};

export type CustomerListResponse = { items: CustomerSummary[]; nextCursor: string | null };

export type MessageConversationSummary = { id: string; customerId: string; bookingId: string | null; customerName: string; email: string | null; phone: string | null; appMessagingAvailable: boolean; lastMessageAt: string; lastMessagePreview: string | null; unreadCount: number };
export type MessageConversationList = { items: MessageConversationSummary[]; unreadCount: number };
export type ConversationMessage = { id: string; senderType: "admin" | "customer" | "system"; channel: "app" | "sms"; direction: "inbound" | "outbound"; body: string; deliveryStatus: string; errorMessage: string | null; createdAt: string; deliveredAt: string | null; readAt: string | null };
export type MessageConversationDetail = { conversation: { id: string; customerId: string; customerName: string; email: string | null; phone: string | null; appMessagingAvailable: boolean }; messages: ConversationMessage[] };

export type CustomerDetail = CustomerSummary & {
  driverLicense: string | null;
  address: string | null;
  over21: boolean | null;
  depositStatus: string | null;
  recentBookings: BookingSummary[];
};

export type VehicleStatus = "available" | "rented" | "maintenance" | "inactive" | "out_of_order" | "archived" | "sold";

export type VehicleDetail = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  dailyRate: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
  securityDeposit: number | null;
  weeklyDiscount: number | null;
  monthlyDiscount: number | null;
  status: VehicleStatus;
  plateNumber: string | null;
  features: string[];
  popular: boolean;
  popularity: number;
  rideShareEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  speedMph: number | null;
  odometer: number | null;
  ignitionOn: boolean | null;
  gpsStatus: string | null;
  lastGpsUpdate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VehicleSummary = VehicleDetail;
export type FleetListResponse = {
  items: VehicleSummary[];
  stats: { total: number; available: number; rented: number; maintenance: number };
  nextCursor: string | null;
};

export type TransactionType = "charge" | "payment" | "refund" | "adjustment";
export type TransactionSummary = {
  id: string;
  title: string;
  category: string | null;
  type: TransactionType;
  method: string;
  notes: string | null;
  amount: number;
  transactionDate: string;
  customerId: string | null;
  bookingId: string | null;
  vehicleId: string | null;
};
export type TransactionListResponse = {
  items: TransactionSummary[];
  stats: { revenue: number; depositsHeld: number; outstanding: number; refunded: number };
  nextCursor: string | null;
};

export type ApiErrorBody = {
  error?: { code?: string; message?: string };
  message?: string;
};
