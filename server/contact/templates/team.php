<?php
/**
 * Notification to the Martis team.
 *
 * @var array<string, string> $enquiry
 * @var string                $site
 * @var string                $source
 * @var DateTimeImmutable     $receivedAt
 */
$font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
$mono = "'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";
$first = contact_first_name($enquiry['name']);
$replyHref = 'mailto:' . rawurlencode($enquiry['email']) . '?subject=' . rawurlencode('Re: Your message to Martis');
$details = [
    ['Name', contact_e($enquiry['name'])],
    ['Email', '<a href="mailto:' . contact_e($enquiry['email']) . '" style="color:#4a6bff;text-decoration:none;">' . contact_e($enquiry['email']) . '</a>'],
    ['Company', $enquiry['company'] !== '' ? contact_e($enquiry['company']) : '<span style="color:#a3a4ab;">Not provided</span>'],
    ['Source', contact_e($source) . ($enquiry['page'] !== ''
        ? ' <span style="color:#a3a4ab;">on</span> <a href="' . contact_e($site . $enquiry['page']) . '" style="color:#4a6bff;text-decoration:none;font-family:' . $mono . ';font-size:13px;">' . contact_e($enquiry['page']) . '</a>'
        : '')],
    ['Received', contact_e($receivedAt->format('j M Y, H:i')) . ' <span style="color:#a3a4ab;">Lisbon</span>'],
];

$preheader = "{$enquiry['name']} sent a message from getmartis.com";
ob_start();
?>
              <tr>
                <td style="padding:22px 44px 0 44px;font-family:<?= $mono ?>;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#6d4fe0;font-weight:600;">
                  New enquiry &nbsp;/&nbsp; <?= contact_e($source) ?>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 44px 0 44px;font-family:<?= $font ?>;font-size:26px;line-height:33px;letter-spacing:-0.4px;color:#14151a;font-weight:700;">
                  <?= contact_e($enquiry['name']) ?> wants to talk about Martis.
                </td>
              </tr>
              <tr>
                <td style="padding:12px 44px 0 44px;font-family:<?= $font ?>;font-size:15px;line-height:24px;color:#4f525b;">
                  A new message arrived through the contact form. Replying to this email goes straight to <?= contact_e($first) ?>.
                </td>
              </tr>
              <tr>
                <td style="padding:26px 44px 0 44px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #ebe8e0;">
                    <?php foreach ($details as [$label, $value]): ?>
                    <tr>
                      <td width="104" valign="top" style="width:104px;padding:12px 12px 12px 0;border-bottom:1px solid #ebe8e0;font-family:<?= $mono ?>;font-size:11px;line-height:20px;letter-spacing:1px;text-transform:uppercase;color:#8a8b92;"><?= $label ?></td>
                      <td valign="top" style="padding:12px 0;border-bottom:1px solid #ebe8e0;font-family:<?= $font ?>;font-size:14px;line-height:20px;color:#1d1e23;word-break:break-word;"><?= $value ?></td>
                    </tr>
                    <?php endforeach; ?>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 44px 0 44px;font-family:<?= $mono ?>;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#8a8b92;font-weight:600;">
                  Message
                </td>
              </tr>
              <tr>
                <td style="padding:10px 44px 0 44px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:18px 20px;background-color:#f7f6f2;border-left:3px solid #5b7fff;border-radius:0 10px 10px 0;font-family:<?= $font ?>;font-size:15px;line-height:24px;color:#25262c;word-break:break-word;">
                        <?= nl2br(contact_e($enquiry['message']), false) ?>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 44px 40px 44px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#4a6bff" style="border-radius:10px;background-color:#4a6bff;background-image:linear-gradient(90deg,#6a45f5 0%,#4a6bff 100%);">
                        <a href="<?= contact_e($replyHref) ?>" style="display:inline-block;padding:13px 24px;font-family:<?= $font ?>;font-size:14px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Reply to <?= contact_e($first) ?> &rarr;</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
<?php
$content = (string) ob_get_clean();
$footer = 'Sent by the contact form on getmartis.com. The sender received an automatic confirmation.';
require __DIR__ . '/layout.php';
