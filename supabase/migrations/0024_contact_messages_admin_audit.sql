drop trigger if exists capture_contact_messages_change on public.contact_messages;
create trigger capture_contact_messages_change
after update on public.contact_messages
for each row
execute function public.capture_admin_table_change('contact_message');
