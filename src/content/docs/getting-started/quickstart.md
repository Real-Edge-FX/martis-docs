---
title: 'Quick Start'
description: 'Create your first Martis resource and get the admin panel running in minutes.'
sidebar:
  order: 2
---

This guide walks you through creating your first Martis resource after installing the package.

## Prerequisites

- Laravel 11 or 12 application
- PHP 8.2+
- Martis installed and configured ([Installation Guide](/getting-started/installation))

## Create Your First Resource

Create a PHP class that extends `Martis\Resource`:

```php
<?php

namespace App\Martis;

use App\Models\Product;
use Illuminate\Http\Request;
use Martis\Fields\Id;
use Martis\Fields\Text;
use Martis\Fields\Number;
use Martis\Fields\Boolean;
use Martis\Resource;

class ProductResource extends Resource
{
    public static function model(): string
    {
        return Product::class;
    }

    public static function titleAttribute(): string
    {
        return 'name';
    }

    public function icon(): string
    {
        return 'shopping-cart';
    }

    public function group(): ?string
    {
        return 'Catalog';
    }

    public function fields(Request $request): array
    {
        return [
            Id::make('id'),
            Text::make('name')->sortable()->searchable()->required(),
            Number::make('price')->min(0)->nullable(),
            Boolean::make('active')->default(true),
        ];
    }
}
```

Resources are **auto-discovered** — no manual registration needed. Place the file in `app/Martis/` and Martis will detect it automatically.

## Access the Admin Panel

Start your development server:

```bash
php artisan serve
```

Then navigate to:

```
http://localhost:8000/martis
```

You will see your `ProductResource` listed in the sidebar under the **Catalog** group with a shopping cart icon.

## Core Workflow

### Index View

The index lists all records with pagination, sorting, and search. Fields marked `.sortable()` get a clickable header; `.searchable()` fields are included in the global search.

### Detail View

Click any row to open the detail view. This shows all fields in read-only mode, including relationship fields.

### Create / Edit

The form respects validation rules defined on fields (`.required()`, `.min()`, `.max()`, `.rules()`, etc.). Custom validation is passed through to Laravel's validator.

## Adding Relationships

```php
use Martis\Fields\BelongsTo;
use Martis\Fields\HasMany;

public function fields(Request $request): array
{
    return [
        Id::make('id'),
        Text::make('name'),
        BelongsTo::make('category', CategoryResource::class),
        HasMany::make('variants', VariantResource::class),
    ];
}
```

## Adding Actions

```php
use Martis\Actions\Action;

public function actions(Request $request): array
{
    return [
        Action::make('activate')
            ->label('Activate Selected')
            ->handler(function ($models) {
                $models->each->update(['active' => true]);
            }),
    ];
}
```

Actions appear in the bulk action dropdown on the index view.

## Customising the Panel

All defaults are overridable. See the [Override System](../core/overrides) for replacing default React components with your own.

## Next Steps

- [Fields Reference](../core/fields) — All available field types and their options
- [Actions](../core/actions) — Bulk and record-level actions
- [Override System](../core/overrides) — Replace any component with custom React
- [Configuration](../core/configuration) — Panel settings, auth guard, route prefix
