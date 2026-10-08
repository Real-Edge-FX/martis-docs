<?php
/**
 * Shared email shell. Table layout and inline styles only: Gmail strips
 * <style> blocks in some views and Outlook renders with Word.
 *
 * @var string $site       Absolute site URL, no trailing slash.
 * @var string $preheader  Inbox preview text.
 * @var string $content    Rendered body rows (trusted HTML).
 * @var string $footer     Footer note (trusted HTML).
 */
$font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
?><!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Martis</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f0e9;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f2f0e9;font-size:1px;line-height:1px;"><?= contact_e($preheader) ?>&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f0e9;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="background-color:#ffffff;border:1px solid #e2ded3;border-radius:16px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td height="4" bgcolor="#5b7fff" style="height:4px;font-size:0;line-height:0;background-color:#5b7fff;background-image:linear-gradient(90deg,#7a3cff 0%,#4a6bff 55%,#12c6e0 100%);border-radius:16px 16px 0 0;">&nbsp;</td>
              </tr>
              <tr>
                <td style="padding:34px 44px 8px 44px;">
                  <a href="<?= contact_e($site) ?>" style="text-decoration:none;"><img src="<?= contact_e($site) ?>/brand/martis-email-logo.png" width="152" height="48" alt="Martis" style="display:block;width:152px;height:48px;border:0;outline:none;color:#4a6bff;font:700 24px <?= $font ?>;"></a>
                </td>
              </tr>
              <?= $content ?>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:26px 24px 0 24px;font-family:<?= $font ?>;font-size:12px;line-height:19px;color:#8a8b92;">
            <?= $footer ?>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 24px 0 24px;font-family:<?= $font ?>;font-size:12px;line-height:19px;color:#8a8b92;">
            <a href="<?= contact_e($site) ?>" style="color:#5d5f68;text-decoration:none;font-weight:600;">getmartis.com</a>
            &nbsp;&middot;&nbsp;
            <a href="<?= contact_e($site) ?>/docs" style="color:#5d5f68;text-decoration:none;">Docs</a>
            &nbsp;&middot;&nbsp;
            <a href="https://github.com/Real-Edge-FX/martis-package" style="color:#5d5f68;text-decoration:none;">GitHub</a>
            <br>The open-source admin foundation for Laravel.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
