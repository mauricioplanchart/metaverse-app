-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_data JSONB NOT NULL DEFAULT '{"name": "Avatar", "color": "#FF6B6B", "accessories": [], "model": "default"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_users INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'private')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_positions table
CREATE TABLE IF NOT EXISTS public.user_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0, "rotation": 0}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, room_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_online ON public.users(is_online);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_positions_room_id ON public.user_positions(room_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_user_id ON public.user_positions(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for rooms table
CREATE POLICY "Anyone can view active rooms" ON public.rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for chat_messages table
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_positions table
CREATE POLICY "Anyone can view user positions" ON public.user_positions
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own position" ON public.user_positions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own position" ON public.user_positions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, email, avatar_data)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_data', '{"name": "Avatar", "color": "#FF6B6B", "accessories": [], "model": "default"}')::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user online status
CREATE OR REPLACE FUNCTION public.update_user_online_status(user_uuid UUID, online_status BOOLEAN)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users 
    SET is_online = online_status, last_seen = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get online users in a room
CREATE OR REPLACE FUNCTION public.get_room_users(room_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    avatar_data JSONB,
    position JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.avatar_data,
        up.position
    FROM public.users u
    LEFT JOIN public.user_positions up ON u.id = up.user_id AND up.room_id = room_uuid
    WHERE u.is_online = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default rooms
INSERT INTO public.rooms (name, description, max_users) VALUES
    ('lobby', 'Main lobby - Welcome to the metaverse!', 100),
    ('garden', 'Peaceful garden area', 50),
    ('city', 'Urban exploration zone', 75),
    ('beach', 'Relaxing beach environment', 60)
ON CONFLICT DO NOTHING;

-- Create real-time publications
BEGIN;
    -- Drop existing publications if they exist
    DROP PUBLICATION IF EXISTS supabase_realtime;
    
    -- Create new publication
    CREATE PUBLICATION supabase_realtime FOR TABLE 
        public.users,
        public.chat_messages,
        public.user_positions,
        public.rooms;
COMMIT; 