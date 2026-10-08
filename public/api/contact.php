<?php

// Thin web-root shim: the handler, its dependencies and its config are
// deployed outside public_html (see server/contact and scripts/deploy.sh).
require (getenv('MARTIS_CONTACT_APP') ?: dirname(__DIR__, 2) . '/contact-api') . '/handle.php';
