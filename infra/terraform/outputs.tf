output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "storage_account_name" {
  value = azurerm_storage_account.app.name
}

output "storage_container_name" {
  value = azurerm_storage_container.knowledge.name
}

output "search_service_name" {
  value = azurerm_search_service.this.name
}

output "openai_account_name" {
  value = azurerm_cognitive_account.openai.name
}

output "function_app_name" {
  value = azurerm_linux_function_app.api.name
}

output "function_app_default_hostname" {
  value = azurerm_linux_function_app.api.default_hostname
}

output "static_web_app_name" {
  value = azurerm_static_web_app.frontend.name
}

output "static_web_app_default_host_name" {
  value = azurerm_static_web_app.frontend.default_host_name
}
