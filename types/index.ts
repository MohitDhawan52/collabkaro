export type UserRole = 'influencer' | 'brand' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'rejected'

export type CollabType = 'paid' | 'barter' | 'both'
export type GigStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type PitchStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type CollabStatus =
  | 'agreement_pending'
  | 'agreement_signed_influencer'
  | 'agreement_signed_brand'
  | 'active'
  | 'deliverable_submitted'
  | 'deliverable_approved'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded'

export interface Profile {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface InfluencerProfile {
  id: string
  user_id: string
  full_name: string
  bio: string | null
  profile_image: string | null
  location: string | null
  niche: string[]
  languages: string[]

  // Instagram
  instagram_handle: string | null
  instagram_followers: number | null
  instagram_engagement_rate: number | null
  instagram_avg_likes: number | null
  instagram_avg_comments: number | null

  // YouTube
  youtube_channel: string | null
  youtube_subscribers: number | null
  youtube_avg_views: number | null
  youtube_total_videos: number | null

  // Facebook
  facebook_page: string | null
  facebook_followers: number | null
  facebook_avg_reach: number | null

  // Twitter
  twitter_handle: string | null
  twitter_followers: number | null

  // Commercials
  instagram_post_price: number | null
  instagram_reel_price: number | null
  instagram_story_price: number | null
  youtube_dedicated_price: number | null
  youtube_integration_price: number | null
  facebook_post_price: number | null
  barter_open: boolean

  // Past work
  brands_worked_with: string[]
  portfolio_links: string[]
  media_kit_url: string | null

  // Bank
  bank_account_name: string | null
  bank_account_number: string | null
  bank_ifsc: string | null

  terms_accepted: boolean
  terms_accepted_at: string | null
  created_at: string
  updated_at: string

  // Joined
  profiles?: Profile
}

export interface BrandProfile {
  id: string
  user_id: string
  brand_name: string
  logo_url: string | null
  website: string | null
  industry: string | null
  description: string | null
  location: string | null
  contact_person: string | null
  contact_phone: string | null
  terms_accepted: boolean
  terms_accepted_at: string | null
  created_at: string
  updated_at: string

  // Joined
  profiles?: Profile
}

export interface Gig {
  id: string
  brand_id: string
  title: string
  description: string
  collab_type: CollabType
  niche_required: string[]
  min_followers: number | null
  max_budget: number | null
  deliverables: string
  timeline: string | null
  platforms: string[]
  status: GigStatus
  payment_status: 'pending' | 'paid'
  payment_id: string | null
  gig_fee: number
  created_at: string
  updated_at: string

  // Joined
  brand_profiles?: BrandProfile
}

export interface Pitch {
  id: string
  gig_id: string
  brand_id: string
  influencer_id: string
  message: string
  status: PitchStatus
  created_at: string
  updated_at: string

  // Joined
  gigs?: Gig
  brand_profiles?: BrandProfile
  influencer_profiles?: InfluencerProfile
}

export interface Collaboration {
  id: string
  pitch_id: string
  gig_id: string
  brand_id: string
  influencer_id: string
  collab_type: 'paid' | 'barter'
  agreed_amount: number | null
  platform_commission: number | null
  influencer_payout: number | null
  status: CollabStatus
  brand_payment_status: 'pending' | 'paid' | 'refunded'
  brand_payment_id: string | null
  influencer_payment_status: 'pending' | 'released' | 'failed'
  agreement_url: string | null
  influencer_signed_at: string | null
  brand_signed_at: string | null
  deliverable_link: string | null
  deliverable_submitted_at: string | null
  deliverable_approved_at: string | null
  terms: string | null
  created_at: string
  updated_at: string

  // Joined
  gigs?: Gig
  brand_profiles?: BrandProfile
  influencer_profiles?: InfluencerProfile
  pitches?: Pitch
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string | null
  read: boolean
  link: string | null
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  type: 'gig_fee' | 'collab_payment' | 'influencer_payout' | 'refund'
  amount: number
  currency: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  status: PaymentStatus
  metadata: Record<string, unknown>
  created_at: string
}

// Form types
export interface InfluencerRegisterForm {
  email: string
  password: string
  full_name: string
  bio: string
  location: string
  niche: string[]
  languages: string[]
  instagram_handle?: string
  instagram_followers?: number
  instagram_engagement_rate?: number
  youtube_channel?: string
  youtube_subscribers?: number
  facebook_page?: string
  facebook_followers?: number
  twitter_handle?: string
  twitter_followers?: number
  instagram_post_price?: number
  instagram_reel_price?: number
  instagram_story_price?: number
  youtube_dedicated_price?: number
  facebook_post_price?: number
  barter_open: boolean
  brands_worked_with: string[]
  bank_account_name?: string
  bank_account_number?: string
  bank_ifsc?: string
  terms_accepted: boolean
}

export interface BrandRegisterForm {
  email: string
  password: string
  brand_name: string
  website?: string
  industry: string
  description: string
  location: string
  contact_person: string
  contact_phone: string
  terms_accepted: boolean
}

export interface CreateGigForm {
  title: string
  description: string
  collab_type: CollabType
  niche_required: string[]
  min_followers?: number
  max_budget?: number
  deliverables: string
  timeline?: string
  platforms: string[]
}

// Niches available on platform
export const NICHES = [
  'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Tech',
  'Gaming', 'Lifestyle', 'Parenting', 'Education', 'Finance',
  'Health', 'Entertainment', 'Sports', 'Music', 'Art',
  'Photography', 'Comedy', 'News', 'DIY', 'Pets', 'Automotive'
]

export const PLATFORMS = [
  'Instagram', 'YouTube', 'Facebook', 'Twitter/X', 'LinkedIn', 'Snapchat', 'Pinterest'
]

export const INDUSTRIES = [
  'Fashion & Apparel', 'Beauty & Cosmetics', 'Food & Beverage', 'Health & Wellness',
  'Technology', 'Travel & Hospitality', 'Fitness & Sports', 'Education', 'Finance',
  'Entertainment', 'Home & Living', 'Automotive', 'Real Estate', 'E-commerce', 'Other'
]