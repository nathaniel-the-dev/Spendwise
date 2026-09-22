import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
				supabaseResponse = NextResponse.next({ request });
				cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
		const url = request.nextUrl.clone();
		url.pathname = '/login';
		return NextResponse.redirect(url);
	}

	// Two-factor: an enrolled user whose session is still aal1 must pass the
	// code check before any dashboard data loads. nextLevel reports aal2 only
	// when a verified factor exists, so this is a no-op for non-enrolled users.
	if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
		const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
		if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
			const url = request.nextUrl.clone();
			url.pathname = '/mfa';
			url.search = '';
			return NextResponse.redirect(url);
		}
	}

	if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
		const url = request.nextUrl.clone();
		url.pathname = '/dashboard';
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
