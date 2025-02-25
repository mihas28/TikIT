--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3
-- Dumped by pg_dump version 17.3

-- Started on 2025-02-25 12:56:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16443)
-- Name: assigment_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assigment_group (
    group_id integer NOT NULL,
    group_name character varying(100) NOT NULL,
    description text,
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assigment_group OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16442)
-- Name: assigment_group_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assigment_group_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assigment_group_group_id_seq OWNER TO postgres;

--
-- TOC entry 4975 (class 0 OID 0)
-- Dependencies: 223
-- Name: assigment_group_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assigment_group_group_id_seq OWNED BY public.assigment_group.group_id;


--
-- TOC entry 220 (class 1259 OID 16415)
-- Name: company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company (
    company_id integer NOT NULL,
    company_name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    street character varying(100),
    city character varying(50),
    post_code character varying(20),
    country character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16414)
-- Name: company_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_company_id_seq OWNER TO postgres;

--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 219
-- Name: company_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_company_id_seq OWNED BY public.company.company_id;


--
-- TOC entry 222 (class 1259 OID 16426)
-- Name: contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract (
    contract_id integer NOT NULL,
    company_id integer NOT NULL,
    short_description character varying(255) NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    state character varying(10) NOT NULL,
    contract_file bytea,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contract_state_check CHECK (((state)::text = ANY ((ARRAY['active'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.contract OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16425)
-- Name: contract_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contract_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_contract_id_seq OWNER TO postgres;

--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 221
-- Name: contract_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contract_contract_id_seq OWNED BY public.contract.contract_id;


--
-- TOC entry 226 (class 1259 OID 16454)
-- Name: ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket (
    ticket_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    impact integer NOT NULL,
    urgency integer NOT NULL,
    state character varying(20) NOT NULL,
    type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp without time zone,
    close_notes text,
    close_code character varying(20),
    caller_id integer NOT NULL,
    parent_ticket_id integer,
    group_id integer NOT NULL,
    CONSTRAINT ticket_close_code_check CHECK (((close_code)::text = ANY ((ARRAY['solved'::character varying, 'duplicate'::character varying, 'canceled'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT ticket_impact_check CHECK ((impact = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT ticket_state_check CHECK (((state)::text = ANY ((ARRAY['new'::character varying, 'open'::character varying, 'awaiting info'::character varying, 'resolved'::character varying, 'closed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT ticket_type_check CHECK (((type)::text = ANY ((ARRAY['service request'::character varying, 'incident'::character varying])::text[]))),
    CONSTRAINT ticket_urgency_check CHECK ((urgency = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE public.ticket OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16453)
-- Name: ticket_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_ticket_id_seq OWNER TO postgres;

--
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 225
-- Name: ticket_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_ticket_id_seq OWNED BY public.ticket.ticket_id;


--
-- TOC entry 227 (class 1259 OID 16484)
-- Name: time_worked; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_worked (
    user_id integer NOT NULL,
    ticket_id integer NOT NULL,
    time_worked double precision NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.time_worked OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16399)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(100) NOT NULL,
    phone_number character varying(20),
    role character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_id integer,
    group_id integer,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'operator'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16398)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4775 (class 2604 OID 16446)
-- Name: assigment_group group_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assigment_group ALTER COLUMN group_id SET DEFAULT nextval('public.assigment_group_group_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 16418)
-- Name: company company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company ALTER COLUMN company_id SET DEFAULT nextval('public.company_company_id_seq'::regclass);


--
-- TOC entry 4772 (class 2604 OID 16429)
-- Name: contract contract_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract ALTER COLUMN contract_id SET DEFAULT nextval('public.contract_contract_id_seq'::regclass);


--
-- TOC entry 4778 (class 2604 OID 16457)
-- Name: ticket ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket ALTER COLUMN ticket_id SET DEFAULT nextval('public.ticket_ticket_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 16402)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4966 (class 0 OID 16443)
-- Dependencies: 224
-- Data for Name: assigment_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assigment_group (group_id, group_name, description, email, created_at, updated_at) FROM stdin;
1	IT Support	Handles all IT related issues	support@techcorp.com	2025-02-24 01:16:59.372616	2025-02-24 01:16:59.372616
\.


--
-- TOC entry 4962 (class 0 OID 16415)
-- Dependencies: 220
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company (company_id, company_name, email, phone, street, city, post_code, country, notes, created_at, updated_at) FROM stdin;
1	Tech Corp	info@techcorp.com	+123456789	Main St 1	Ljubljana	1000	Slovenia	Leading IT company	2025-02-24 01:16:59.372616	2025-02-24 01:16:59.372616
\.


--
-- TOC entry 4964 (class 0 OID 16426)
-- Dependencies: 222
-- Data for Name: contract; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract (contract_id, company_id, short_description, description, start_date, end_date, state, contract_file, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4968 (class 0 OID 16454)
-- Dependencies: 226
-- Data for Name: ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket (ticket_id, title, description, impact, urgency, state, type, created_at, accepted_at, updated_at, closed_at, close_notes, close_code, caller_id, parent_ticket_id, group_id) FROM stdin;
1	Network Issue	Cannot connect to VPN	2	2	new	incident	2025-02-24 01:16:59.372616	\N	2025-02-24 01:16:59.372616	\N	\N	\N	1	\N	1
\.


--
-- TOC entry 4969 (class 0 OID 16484)
-- Dependencies: 227
-- Data for Name: time_worked; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_worked (user_id, ticket_id, time_worked, description, created_at, updated_at) FROM stdin;
1	1	1.5	Investigated VPN issue.	2025-02-24 01:16:59.372616	2025-02-24 01:16:59.372616
\.


--
-- TOC entry 4960 (class 0 OID 16399)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password, first_name, last_name, email, phone_number, role, created_at, updated_at, company_id, group_id) FROM stdin;
1	admin	hashedpassword	John	Doe	admin@techcorp.com	+123456789	admin	2025-02-24 01:16:59.372616	2025-02-24 01:16:59.372616	1	\N
\.


--
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 223
-- Name: assigment_group_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assigment_group_group_id_seq', 1, true);


--
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 219
-- Name: company_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_company_id_seq', 1, true);


--
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 221
-- Name: contract_contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contract_contract_id_seq', 1, false);


--
-- TOC entry 4983 (class 0 OID 0)
-- Dependencies: 225
-- Name: ticket_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_ticket_id_seq', 1, true);


--
-- TOC entry 4984 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, true);


--
-- TOC entry 4801 (class 2606 OID 16452)
-- Name: assigment_group assigment_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assigment_group
    ADD CONSTRAINT assigment_group_pkey PRIMARY KEY (group_id);


--
-- TOC entry 4797 (class 2606 OID 16424)
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4799 (class 2606 OID 16436)
-- Name: contract contract_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_pkey PRIMARY KEY (contract_id);


--
-- TOC entry 4803 (class 2606 OID 16468)
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (ticket_id);


--
-- TOC entry 4805 (class 2606 OID 16492)
-- Name: time_worked time_worked_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_worked
    ADD CONSTRAINT time_worked_pkey PRIMARY KEY (user_id, ticket_id);


--
-- TOC entry 4791 (class 2606 OID 16413)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4793 (class 2606 OID 16409)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4795 (class 2606 OID 16411)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4808 (class 2606 OID 16437)
-- Name: contract contract_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract
    ADD CONSTRAINT contract_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id);


--
-- TOC entry 4809 (class 2606 OID 16469)
-- Name: ticket ticket_caller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.users(user_id);


--
-- TOC entry 4810 (class 2606 OID 16479)
-- Name: ticket ticket_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.assigment_group(group_id);


--
-- TOC entry 4811 (class 2606 OID 16474)
-- Name: ticket ticket_parent_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_parent_ticket_id_fkey FOREIGN KEY (parent_ticket_id) REFERENCES public.ticket(ticket_id);


--
-- TOC entry 4812 (class 2606 OID 16498)
-- Name: time_worked time_worked_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_worked
    ADD CONSTRAINT time_worked_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(ticket_id);


--
-- TOC entry 4813 (class 2606 OID 16493)
-- Name: time_worked time_worked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_worked
    ADD CONSTRAINT time_worked_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4806 (class 2606 OID 16503)
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id);


--
-- TOC entry 4807 (class 2606 OID 16508)
-- Name: users users_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.assigment_group(group_id);


-- Completed on 2025-02-25 12:56:26

--
-- PostgreSQL database dump complete
--

