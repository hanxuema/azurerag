variable "project_name" {
  type        = string
  description = "Base name for all resources."
  default     = "ragdemo"
}

variable "location" {
  type        = string
  description = "Azure region for deployment."
  default     = "australiaeast"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name."
  default     = "rg-rag-demo"
}

variable "search_sku" {
  type        = string
  description = "Azure AI Search SKU."
  default     = "basic"
}

variable "openai_sku_name" {
  type        = string
  description = "Azure AI services SKU."
  default     = "S0"
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to resources."
  default = {
    workload = "rag-demo"
    managed  = "terraform"
  }
}
