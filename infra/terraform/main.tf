locals {
  normalized_project = lower(replace(var.project_name, "/[^a-zA-Z0-9]/", ""))
  frontend_files = toset(setsubtract(
    fileset("${path.module}/../../frontend", "**"),
    ["config.js", "config.production.js.template", "staticwebapp.config.json"]
  ))
  backend_archive_hash = sha256(join("", concat(
    [
      for file_name in fileset("${path.module}/../../backend/src", "**") :
      "${file_name}:${filesha256("${path.module}/../../backend/src/${file_name}")}"
    ],
    [
      "host.json:${filesha256("${path.module}/../../backend/host.json")}",
      "package.json:${filesha256("${path.module}/../../backend/package.json")}",
      "package-lock.json:${filesha256("${path.module}/../../backend/package-lock.json")}"
    ]
  )))
  text_content_types = {
    css  = "text/css"
    html = "text/html"
    js   = "application/javascript"
    json = "application/json"
    md   = "text/markdown"
    txt  = "text/plain"
  }
  function_api_base_url = "https://${azurerm_linux_function_app.api.default_hostname}/api"
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = "law-${local.normalized_project}-${random_string.suffix.result}"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_application_insights" "this" {
  name                = "appi-${local.normalized_project}-${random_string.suffix.result}"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  workspace_id        = azurerm_log_analytics_workspace.this.id
  application_type    = "web"
  tags                = var.tags
}

resource "azurerm_storage_account" "app" {
  name                            = "st${local.normalized_project}${random_string.suffix.result}"
  resource_group_name             = azurerm_resource_group.this.name
  location                        = azurerm_resource_group.this.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  allow_nested_items_to_be_public = false
  min_tls_version                 = "TLS1_2"
  tags                            = var.tags
}

resource "azurerm_storage_account_static_website" "frontend" {
  storage_account_id = azurerm_storage_account.app.id
  index_document     = "index.html"
}

resource "azurerm_storage_container" "knowledge" {
  name                  = "knowledge-base"
  storage_account_id    = azurerm_storage_account.app.id
  container_access_type = "private"
}

resource "azurerm_search_service" "this" {
  name                          = "srch-${local.normalized_project}-${random_string.suffix.result}"
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  sku                           = var.search_sku
  local_authentication_enabled  = true
  authentication_failure_mode   = "http401WithBearerChallenge"
  hosting_mode                  = "default"
  public_network_access_enabled = true
  tags                          = var.tags
}

resource "azurerm_cognitive_account" "openai" {
  name                          = "aoai-${local.normalized_project}-${random_string.suffix.result}"
  location                      = azurerm_resource_group.this.location
  resource_group_name           = azurerm_resource_group.this.name
  kind                          = "OpenAI"
  sku_name                      = var.openai_sku_name
  public_network_access_enabled = true
  custom_subdomain_name         = "aoai-${local.normalized_project}-${random_string.suffix.result}"
  tags                          = var.tags
}

resource "azurerm_key_vault" "this" {
  name                          = "kv-${local.normalized_project}-${random_string.suffix.result}"
  location                      = azurerm_resource_group.this.location
  resource_group_name           = azurerm_resource_group.this.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  purge_protection_enabled      = false
  soft_delete_retention_days    = 7
  rbac_authorization_enabled    = true
  public_network_access_enabled = true
  tags                          = var.tags
}

data "azurerm_client_config" "current" {}

resource "azurerm_service_plan" "functions" {
  name                = "plan-${local.normalized_project}-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = var.tags
}

resource "terraform_data" "backend_dependencies" {
  triggers_replace = {
    package_json      = filesha256("${path.module}/../../backend/package.json")
    package_lock_json = filesha256("${path.module}/../../backend/package-lock.json")
  }

  provisioner "local-exec" {
    command     = "npm ci --omit=dev"
    working_dir = "${path.module}/../../backend"
  }
}

data "archive_file" "backend_package" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend"
  output_path = "${path.module}/.terraform/backend-${local.backend_archive_hash}.zip"

  depends_on = [terraform_data.backend_dependencies]
}

resource "azurerm_linux_function_app" "api" {
  name                       = "func-${local.normalized_project}-${random_string.suffix.result}"
  resource_group_name        = azurerm_resource_group.this.name
  location                   = azurerm_resource_group.this.location
  service_plan_id            = azurerm_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.app.name
  storage_account_access_key = azurerm_storage_account.app.primary_access_key
  https_only                 = true
  virtual_network_subnet_id  = null
  tags                       = var.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      node_version = "22"
    }
    application_insights_connection_string = azurerm_application_insights.this.connection_string
    application_insights_key               = azurerm_application_insights.this.instrumentation_key

    cors {
      allowed_origins     = ["*"]
      support_credentials = false
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"              = "node"
    "AZURE_OPENAI_ENDPOINT"                 = azurerm_cognitive_account.openai.endpoint
    "AZURE_OPENAI_CHAT_DEPLOYMENT"          = "gpt-4o-mini"
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT"     = "text-embedding-3-small"
    "AZURE_SEARCH_ENDPOINT"                 = "https://${azurerm_search_service.this.name}.search.windows.net"
    "AZURE_SEARCH_INDEX_NAME"               = "rag-demo-index"
    "AZURE_STORAGE_ACCOUNT_URL"             = azurerm_storage_account.app.primary_blob_endpoint
    "AZURE_STORAGE_CONTAINER_NAME"          = azurerm_storage_container.knowledge.name
    "RAG_SYSTEM_PROMPT"                     = "Answer only from the provided sources. If the answer is not supported by the sources, say that clearly."
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.this.connection_string
    "BACKEND_PACKAGE_SHA256"                = data.archive_file.backend_package.output_sha256
  }

  zip_deploy_file = data.archive_file.backend_package.output_path
}

resource "azurerm_storage_blob" "frontend_assets" {
  for_each = local.frontend_files

  name                   = each.value
  storage_account_name   = azurerm_storage_account.app.name
  storage_container_name = "$web"
  type                   = "Block"
  source_content         = file("${path.module}/../../frontend/${each.value}")
  content_type = lookup(
    local.text_content_types,
    element(reverse(split(".", each.value)), 0),
    "application/octet-stream"
  )

  depends_on = [azurerm_storage_account_static_website.frontend]
}

resource "azurerm_storage_blob" "frontend_config" {
  name                   = "config.js"
  storage_account_name   = azurerm_storage_account.app.name
  storage_container_name = "$web"
  type                   = "Block"
  source_content         = replace(file("${path.module}/../../frontend/config.production.js.template"), "__API_BASE_URL__", local.function_api_base_url)
  content_type           = "application/javascript"

  depends_on = [azurerm_storage_account_static_website.frontend]
}

resource "azurerm_storage_blob" "seed_documents" {
  for_each = fileset("${path.module}/../../data/seed-docs", "**")

  name                   = each.value
  storage_account_name   = azurerm_storage_account.app.name
  storage_container_name = azurerm_storage_container.knowledge.name
  type                   = "Block"
  source                 = "${path.module}/../../data/seed-docs/${each.value}"
  content_type = lookup(
    local.text_content_types,
    element(reverse(split(".", each.value)), 0),
    "application/octet-stream"
  )
}

resource "azurerm_role_assignment" "api_storage_blob_data_contributor" {
  scope                = azurerm_storage_account.app.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_function_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "api_search_service_contributor" {
  scope                = azurerm_search_service.this.id
  role_definition_name = "Search Index Data Contributor"
  principal_id         = azurerm_linux_function_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "api_search_service_admin" {
  scope                = azurerm_search_service.this.id
  role_definition_name = "Search Service Contributor"
  principal_id         = azurerm_linux_function_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "api_cognitive_services_user" {
  scope                = azurerm_cognitive_account.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_linux_function_app.api.identity[0].principal_id
}
