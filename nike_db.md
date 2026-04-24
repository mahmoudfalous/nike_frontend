classDiagram
direction BT
class auth_group {
   varchar(150) name
   integer id
}
class auth_group_permissions {
   integer group_id
   integer permission_id
   bigint id
}
class auth_permission {
   varchar(255) name
   integer content_type_id
   varchar(100) codename
   integer id
}
class cart {
   integer quantity
   timestamp with time zone added_at
   timestamp with time zone updated_at
   integer user_id
   integer product_id
   integer id
}
class django_admin_log {
   timestamp with time zone action_time
   text object_id
   varchar(200) object_repr
   smallint action_flag
   text change_message
   integer content_type_id
   integer user_id
   integer id
}
class django_content_type {
   varchar(100) app_label
   varchar(100) model
   integer id
}
class django_migrations {
   varchar(255) app
   varchar(255) name
   timestamp with time zone applied
   bigint id
}
class django_session {
   text session_data
   timestamp with time zone expire_date
   varchar(40) session_key
}
class order_items {
   integer quantity
   numeric(10,2) price_at_order
   integer order_id
   integer product_id
   integer id
}
class orders {
   numeric(10,2) total_price
   varchar(20) status
   timestamp with time zone created_at
   timestamp with time zone updated_at
   integer user_id
   integer id
}
class products {
   varchar(255) name
   text description
   numeric(10,2) price
   integer stock
   timestamp with time zone created_at
   timestamp with time zone updated_at
   integer id
}
class users {
   varchar(128) password
   timestamp with time zone last_login
   boolean is_superuser
   varchar(255) full_name
   varchar(254) email
   varchar(20) phone
   text address
   boolean is_active
   boolean is_staff
   timestamp with time zone created_at
   timestamp with time zone updated_at
   integer id
}
class users_groups {
   integer customuser_id
   integer group_id
   bigint id
}
class users_user_permissions {
   integer customuser_id
   integer permission_id
   bigint id
}

auth_group_permissions  -->  auth_group : group_id:id
auth_group_permissions  -->  auth_permission : permission_id:id
auth_permission  -->  django_content_type : content_type_id:id
cart  -->  products : product_id:id
cart  -->  users : user_id:id
django_admin_log  -->  django_content_type : content_type_id:id
django_admin_log  -->  users : user_id:id
order_items  -->  orders : order_id:id
order_items  -->  products : product_id:id
orders  -->  users : user_id:id
users_groups  -->  auth_group : group_id:id
users_groups  -->  users : customuser_id:id
users_user_permissions  -->  auth_permission : permission_id:id
users_user_permissions  -->  users : customuser_id:id
