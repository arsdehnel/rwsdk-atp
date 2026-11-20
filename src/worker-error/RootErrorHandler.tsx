export default function RootErrorHandler({ error }: { error: unknown }): React.JSX.Element {
	const message = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : undefined;

	return (
		<div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
			<h1 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Something went wrong</h1>
			{import.meta.env.DEV ? (
				<>
					<p style={{ color: '#374151', marginBottom: '1rem' }}>{message}</p>
					{stack && (
						<pre
							style={{
								background: '#f3f4f6',
								padding: '1rem',
								borderRadius: '0.375rem',
								overflow: 'auto',
								fontSize: '0.75rem',
								color: '#374151',
							}}
						>
							{stack}
						</pre>
					)}
				</>
			) : (
				<p style={{ color: '#374151' }}>An unexpected error occurred. Please try again later.</p>
			)}
		</div>
	);
}
