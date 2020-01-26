CREATE TABLE public.form (
    id text NOT NULL,
    schema text NOT NULL
);

ALTER TABLE ONLY public.form
    ADD CONSTRAINT form_pkey PRIMARY KEY (id);
