---
title: 'Troubleshooting'
description: 'Solutions to common issues when installing and using Martis.'
sidebar:
  order: 4
---

## Installation Issues

### "Class not found" after install

Run `composer dump-autoload` after adding the service provider (if not using auto-discovery):

```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

### Assets not loading (404 on `/vendor/martis/`)

Publish the package assets:

```bash
php artisan vendor:publish --tag=martis-assets --force
```

Then clear your browser cache and hard-refresh.

### "Vite manifest not found"

This means the frontend assets were not built. Run:

```bash
php artisan vendor:publish --tag=martis-assets --force
```

If you installed from source, ensure the package has been built before publishing.

## Panel Access Issues

### Cannot access `/martis`

1. Ensure the route is registered — check `php artisan route:list | grep martis`
2. Verify the `prefix` in `config/martis.php` matches your URL
3. Check that the auth guard is configured correctly (see [Authentication](../core/authentication))

### Redirected to login page unexpectedly

Martis uses Laravel's configured `auth` guard by default. Ensure your user is authenticated:

```php
// config/martis.php
'guard' => 'web', // or your custom guard name
```

### Panel shows a blank white page

Open your browser developer console. Common causes:
- JavaScript error during load — check the console for the specific error
- Mixed content warning if on HTTPS with HTTP assets
- Outdated cached assets — hard-refresh with `Ctrl+Shift+R`

## Resource Issues

### Resource not appearing in sidebar

Resources in `app/Martis/` are auto-discovered. If yours is missing:

1. Check the namespace matches: `namespace App\Martis;`
2. Ensure the class extends `Martis\Resource`
3. Run `php artisan config:clear` (discovery can be cached)
4. Check `php artisan martis:resources` to list discovered resources

### Search returns no results

Ensure the fields you want to search are marked `.searchable()`:

```php
Text::make('name')->searchable(),
```

Only fields explicitly marked `.searchable()` are included in the global search query.

### Relationship field shows empty / not loading

1. Ensure the related resource exists and is auto-discovered
2. Check that the foreign key and relationship method are correctly defined on the model
3. Verify the related model is accessible to the current auth user (policy or gate)

## Field Issues

### File upload fails (422 / 413)

Check PHP and server upload limits:

```bash
# php.ini settings to verify:
upload_max_filesize = 10M
post_max_size = 10M
```

Set limits on the field:

```php
File::make('document')->maxSize(10240), // 10 MB in KB
```

### Boolean field not saving

Ensure the database column is `boolean` or `tinyint(1)` and the Eloquent cast is set:

```php
protected $casts = ['active' => 'boolean'];
```

### Date field returns wrong format

Use the `.format()` option to match your database/display format:

```php
Date::make('published_at')->format('Y-m-d'),
```

## Action Issues

### Action does not appear in dropdown

Actions are filtered by the `canRun` policy method. If you have a policy defined, ensure it allows the action. To allow all authenticated users:

```php
public function authorize(Request $request): bool
{
    return $request->user() !== null;
}
```

### Action runs but changes are not visible

Martis uses TanStack Query for caching. After an action, the index is automatically invalidated. If changes are not visible:
1. Wait for the refetch (typically < 1 second)
2. Manually refresh the page as a fallback

## Performance Issues

### Slow index page with many records

1. Ensure you have database indexes on columns used for sorting and searching
2. Use `.hideFromIndex()` on heavy fields (e.g. large text, nested relationships) that are not needed in the list
3. Reduce `perPage` in resource configuration

### Slow relationship fields

BelongsTo fields load options via API. For large datasets, implement search-as-you-type:

```php
BelongsTo::make('category', CategoryResource::class)->searchable(),
```

## Getting Help

- [GitHub Issues](https://github.com/Real-Edge-FX/martis-package/issues) — bug reports and feature requests
- [GitHub Discussions](https://github.com/Real-Edge-FX/martis-package/discussions) — questions and community support
