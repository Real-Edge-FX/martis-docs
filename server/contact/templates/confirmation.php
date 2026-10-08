<?php
/**
 * Confirmation sent to the person who used the contact form.
 *
 * @var array<string, string> $enquiry
 * @var string                $site
 * @var string                $support
 */
$font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
$mono = "'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";
$first = contact_first_name($enquiry['name']);
$resources = [
    ['Installation guide', 'From composer require to a running panel.', '/docs/getting-started/installation'],
    ['Quick start', 'Your first resource, fields and filters.', '/docs/getting-started/quick-start'],
    ['Martis and Nova', 'How the two compare, feature by feature.', '/compare'],
];

$preheader = "Thanks, {$first}. Someone from the Martis team will reply to you personally.";
ob_start();
?>
              <tr>
                <td style="padding:22px 44px 0 44px;font-family:<?= $mono ?>;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#2f9d63;font-weight:600;">
                  &#10003;&nbsp; Message received
                </td>
              </tr>
              <tr>
                <td style="padding:10px 44px 0 44px;font-family:<?= $font ?>;font-size:26px;line-height:33px;letter-spacing:-0.4px;color:#14151a;font-weight:700;">
                  Thanks, <?= contact_e($first) ?>. We&rsquo;ve got your message.
                </td>
              </tr>
              <tr>
                <td style="padding:12px 44px 0 44px;font-family:<?= $font ?>;font-size:15px;line-height:24px;color:#4f525b;">
                  A person from the Martis team reads every message and will reply to this address, usually within one or two business days. No sales sequence, no mailing list: just a direct answer.
                </td>
              </tr>
              <tr>
                <td style="padding:28px 44px 0 44px;font-family:<?= $mono ?>;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#8a8b92;font-weight:600;">
                  Your message
                </td>
              </tr>
              <tr>
                <td style="padding:10px 44px 0 44px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:18px 20px;background-color:#f7f6f2;border-left:3px solid #5b7fff;border-radius:0 10px 10px 0;font-family:<?= $font ?>;font-size:14px;line-height:23px;color:#4a4c54;word-break:break-word;">
                        <?= nl2br(contact_e($enquiry['message']), false) ?>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 44px 0 44px;font-family:<?= $mono ?>;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#8a8b92;font-weight:600;">
                  While you wait
                </td>
              </tr>
              <tr>
                <td style="padding:6px 44px 0 44px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <?php foreach ($resources as [$title, $summary, $path]): ?>
                    <tr>
                      <td style="padding:14px 0;border-bottom:1px solid #ebe8e0;">
                        <a href="<?= contact_e($site . $path) ?>" style="text-decoration:none;">
                          <span style="font-family:<?= $font ?>;font-size:15px;line-height:22px;font-weight:600;color:#1d1e23;"><?= contact_e($title) ?></span>
                          <span style="font-family:<?= $font ?>;font-size:15px;line-height:22px;font-weight:600;color:#4a6bff;">&nbsp;&rarr;</span><br>
                          <span style="font-family:<?= $font ?>;font-size:13px;line-height:20px;color:#7a7c84;"><?= contact_e($summary) ?></span>
                        </a>
                      </td>
                    </tr>
                    <?php endforeach; ?>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 44px 0 44px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#4a6bff" style="border-radius:10px;background-color:#4a6bff;background-image:linear-gradient(90deg,#6a45f5 0%,#4a6bff 100%);">
                        <a href="<?= contact_e($site) ?>/docs" style="display:inline-block;padding:13px 24px;font-family:<?= $font ?>;font-size:14px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Explore the documentation &rarr;</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 44px 40px 44px;font-family:<?= $font ?>;font-size:15px;line-height:24px;color:#4f525b;">
                  Want to add something? Just reply to this email.<br><br>
                  <span style="color:#14151a;font-weight:600;">The Martis team</span>
                </td>
              </tr>
<?php
$content = (string) ob_get_clean();
$footer = 'You are receiving this one-time confirmation because this address was used in the contact form on getmartis.com. If that was not you, you can ignore it or write to <a href="mailto:' . contact_e($support) . '" style="color:#5d5f68;">' . contact_e($support) . '</a>.';
require __DIR__ . '/layout.php';
