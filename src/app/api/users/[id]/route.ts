import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userService } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, role' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const user = await userService.findById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o novo e-mail já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await userService.findByEmail(email);
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { error: 'E-mail já está em uso' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { name, email, role };

    // Atualizar senha apenas se fornecida
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await userService.update(id, updateData);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Não permitir que o admin delete a si mesmo
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      );
    }

    const success = await userService.delete(params.id);

    if (!success) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
