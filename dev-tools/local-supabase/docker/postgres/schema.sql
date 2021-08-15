SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'maker'
);


--
-- Name: categoryNames; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."categoryNames" AS ENUM (
    'Temperatur',
    'CO2',
    'Luftfeuchtigkeit',
    'Druck',
    'PAXCounter',
    'Lautstärke'
);


--
-- Name: connectionTypes; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."connectionTypes" AS ENUM (
    'ttn',
    'other'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select nullif(current_setting('request.jwt.claim.role', true), '')::text;
$$;


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;


--
-- Name: delete_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
delete from public.userprofiles
where id = auth.uid();
delete from auth.users
where id = auth.uid();
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ begin
insert into public.userprofiles (id)
values (new.id);
return new;
end;
$$;


--
-- Name: update_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_email(new_email text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ begin
UPDATE auth.users
set email = new_email
where id = auth.uid();
return found;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone
);


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone character varying(15) DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change character varying(15) DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED
);


--
-- Name: authtokens_niceId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."authtokens_niceId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: authtokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authtokens (
    "niceId" integer DEFAULT nextval('public."authtokens_niceId_seq"'::regclass) NOT NULL,
    id text NOT NULL,
    description character varying(200) NOT NULL,
    "projectId" integer NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer DEFAULT nextval('public.categories_id_seq'::regclass) NOT NULL,
    name public."categoryNames" NOT NULL,
    description character varying(200) NOT NULL
);


--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id integer DEFAULT nextval('public.devices_id_seq'::regclass) NOT NULL,
    "externalId" character varying(20) NOT NULL,
    name character varying(20),
    "projectId" integer NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer DEFAULT nextval('public.projects_id_seq'::regclass) NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(200),
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    connectype public."connectionTypes" DEFAULT 'ttn'::public."connectionTypes" NOT NULL,
    location character varying(20),
    "userId" uuid NOT NULL,
    "categoryId" integer NOT NULL
);


--
-- Name: records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.records (
    id integer DEFAULT nextval('public.records_id_seq'::regclass) NOT NULL,
    "recordedAt" timestamp with time zone NOT NULL,
    measurements double precision[],
    longitude real,
    latitude real,
    altitude real,
    "deviceId" integer NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: userprofiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.userprofiles (
    id uuid NOT NULL,
    name character varying(20),
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role public."Role" DEFAULT 'maker'::public."Role"
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: authtokens authtokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authtokens
    ADD CONSTRAINT authtokens_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: userprofiles userprofiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userprofiles
    ADD CONSTRAINT userprofiles_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_token_idx ON auth.refresh_tokens USING btree (token);


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, email);


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: authtokens authtokens_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authtokens
    ADD CONSTRAINT "authtokens_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: authtokens authtokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authtokens
    ADD CONSTRAINT "authtokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.userprofiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devices devices_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT "devices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devices devices_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.userprofiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.userprofiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: records records_deviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT "records_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: authtokens Allow individual delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual delete access" ON public.authtokens FOR DELETE USING ((auth.uid() = "userId"));


--
-- Name: devices Allow individual delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual delete access" ON public.devices FOR DELETE USING ((auth.uid() = "userId"));


--
-- Name: projects Allow individual delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual delete access" ON public.projects FOR DELETE USING ((auth.uid() = "userId"));


--
-- Name: userprofiles Allow individual delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual delete access" ON public.userprofiles FOR DELETE USING ((auth.uid() = id));


--
-- Name: devices Allow individual insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual insert access" ON public.devices FOR INSERT WITH CHECK ((auth.uid() = "userId"));


--
-- Name: projects Allow individual insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual insert access" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = "userId"));


--
-- Name: userprofiles Allow individual insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual insert access" ON public.userprofiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: projects Allow individual insert access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual insert access for authenticated users" ON public.projects FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: devices Allow individual update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual update access" ON public.devices FOR UPDATE USING ((auth.uid() = "userId"));


--
-- Name: projects Allow individual update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual update access" ON public.projects FOR UPDATE USING ((auth.uid() = "userId"));


--
-- Name: userprofiles Allow individual update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow individual update access" ON public.userprofiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: devices Allow read access for authenticated on public devices table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access for authenticated on public devices table" ON public.devices FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: projects Allow read access for authenticated on public projects table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access for authenticated on public projects table" ON public.projects FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: records Allow read access for authenticated on public records table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access for authenticated on public records table" ON public.records FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: userprofiles Allow read access for authenticated on public users table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access for authenticated on public users table" ON public.userprofiles FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: categories Allow read access on public categories table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on public categories table" ON public.categories FOR SELECT USING ((auth.role() = 'anon'::text));


--
-- Name: categories Allow read access on public categories table authorized; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on public categories table authorized" ON public.categories FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: devices Allow read access on public devices table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on public devices table" ON public.devices FOR SELECT USING ((auth.role() = 'anon'::text));


--
-- Name: projects Allow read access on public projects table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on public projects table" ON public.projects FOR SELECT USING ((auth.role() = 'anon'::text));


--
-- Name: records Allow read access on public records table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on public records table" ON public.records FOR SELECT USING ((auth.role() = 'anon'::text));


--
-- Name: userprofiles Allow read access on public users table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access on public users table" ON public.userprofiles FOR SELECT USING ((auth.role() = 'anon'::text));


--
-- Name: authtokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.authtokens ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

--
-- Name: userprofiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.userprofiles ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

