export function ProductVisual({ image = '/screenshots/resource-index.png', label = 'Client operations' }: { image?: string; label?: string }) {
  return (
    <figure className="product-visual">
      <div className="product-visual__chrome">
        <span /><span /><span />
        <p>{label}</p>
        <span className="product-visual__live">Live product</span>
      </div>
      <div className="product-visual__image-wrap">
        <img src={image} alt={`Martis interface — ${label}`} width="1280" height="800" />
      </div>
    </figure>
  )
}
